'use strict'

const express    = require('express');
const bodyParser = require('body-parser');
// const rainbow    = require('rainbow');
const jwt = require('jsonwebtoken');
const expressJwt= require('express-jwt');
const {User, Record, Video} = require('./models');
const fs = require('fs')
const moment = require('moment')

const app = express();

const jwt_secret = process.env.JWT_SECRET || 'guessit'

const EXPIRATION_IN_SECOND = 3600 * 24

const PRIVATE_KEY = fs.readFileSync('private.key')

app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({extended:false}));
app.use(expressJwt({secret:jwt_secret}).unless({path:['/tokens', /^\/users/]}));

//Error Handle
app.use((err, req, res, next) => {
  if(err.name === 'UnauthorizedError'){
    res.status(401).send(err.message);
  }else{
    res.status(400).send(err.message);
  }
});


// User Operations, just for temporary
app.post('/users', (req, res, next) => {
  let user = new User(req.body)
  user.save()
  .then(user => res.status(201).send(user))
  .catch(next)
})

app.get('/users', (req, res, next) => {
  User.find()
  .then(users => res.send(users))
  .catch(next)

})

app.put('/users/:id', (req, res, next) => {
  User.findByIdAndUpdate(req.params.id, req.body, {new : true})
  .then(user => res.send(user))
  .catch(next)
})

app.delete('/users/:id', (req, res, next) => {
  User.findByIdAndRemove(req.params.id)
  .then(user => res.send(user))
  .catch(next)
})

// Login 
app.post('/tokens', (req, res, next) => {
  User.findOne({name:req.body.name, password:req.body.password}).select('')
    .then(user => {
      if(user){
        let token = jwt.sign({iss:user.id}, jwt_secret, {expiresIn:EXPIRATION_IN_SECOND});
        res.send({
          expiresAt : jwt.decode(token).exp,
          token     : token
        });
      }else{
        // next(new Error()) //this will be wrong, why?
        res.status(400).send()
      }
    })
    .catch(next)
})


app.get('/videos', (req, res, next) => {
  Video.find().select('name latest description cover')
    .then(vs => res.send(vs))
    .catch(next)
})

app.get('/records', (req, res, next) => {

  let {beginDay, days=1, groupByDate} = req.query

  let beginMoment = moment(beginDay)
  if( !beginMoment.isValid() ) {
    next(new Error(`${beginDay} is invalid, date format should be like 2016-3-1`))
    return
  }

  let endMoment = moment(beginMoment).add(days, 'days')

  if(groupByDate !== undefined){

    Record.mapReduce({
      map: function(){
        emit(`${this.created.getFullYear()}-${this.created.getMonth() + 1}-${this.created.getDate()}`,
          {times:1, time: this.time || 0})
      },
      reduce: function(key, values){
        return {times:values.length, time:values.reduce((pre, cur) => pre + (cur.time || 0), 0)}
      },
      query:{
        userId:req.user.iss,
        created:{
          '$gt':beginMoment,
          '$lt':endMoment
        }
      }
    })
      .then(groups => 
        res.send( groups.map(({_id, value}) =>
          Object.assign({date:_id}, value) )
        ) 
      )
    .catch(next)

  } else {
    Record.find()
      .where('userId').equals(req.user.iss)
      .where('created').gt(beginMoment).lt(endMoment)
      .then(records => res.send(records))
      .catch(next)
  }
})

app.patch('/records/:id', (req, res, next) => {

  Record.findByIdAndUpdate(req.params.id, req.body, {new:true})
  .then(reply => res.status(201).send(reply))
  .catch(next)

})

app.post('/records', (req, res, next) => {

  new Record(Object.assign(req.body, {userId:req.user.iss}))
    .save()
    .then(record => new Promise((resolve, reject) => {
    
      jwt.sign(req.body, PRIVATE_KEY, {algorithm:'RS256'}, (err, token) => {
        if(err){
          reject(err)
        } else {
          resolve({token, id:record.id})
        }
      })
    }))
    .then(response => res.status(201).send(response))
    .catch(next)

})

// rainbow.route(app);
app.listen(process.env.PORT || 80);
module.exports = app;
