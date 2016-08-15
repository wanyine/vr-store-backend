'use strict'

const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
// const rainbow    = require('rainbow');
const expressJwt= require('express-jwt');
const app = express();
app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({extended:false}));
app.use(expressJwt({secret:process.env.JWT_SECRET}).unless({path:['/token', '/users', '/videos', '/videos/1/token']}));
app.use((err, req, res, next) => {
  console.log(err)
  if(err.name === 'UnauthorizedError'){
    res.status(401).send(err.message);
  }else{
    res.status(400).send(err.message);
  }
});


(() => {

  let port     = process.env.MONGODB_PORT_27017_TCP_PORT || 27017;
  let addr     = process.env.MONGODB_PORT_27017_TCP_ADDR || '127.0.0.1';
  let instance = process.env.MONGODB_INSTANCE_NAME || 'test';
  let password = process.env.MONGODB_PASSWORD;
  let username = process.env.MONGODB_USERNAME;

  let auth = !!username ? username + ':' + password  + '@' : '';
  // 'mongodb://user:pass@localhost:port/database'
  mongoose.connect('mongodb://' + auth + addr + ':' + port + '/' + instance);
  mongoose.connection.on('error', err=> console.log(err));
  mongoose.connection.on('disconnected', ()=> console.log('disconnected'));
  process.on('SIGINT', () => {
    mongoose.connection.close(()=> {
      console.log('interrupted, db closed');
      process.exit(-1);
    });
  })

})();

// rainbow.route(app);
app.listen(process.env.PORT || 80);



const jwt = require('jsonwebtoken');
const {User} = require('./models');

const EXPIRATION_IN_SECOND = 3

// Login 
app.post('/token', (req, res) => {
  User.findOne({name:req.body.name})
    .then(user => {
      console.log(user);
      if(user && user.comparePassword(req.body.password)){
        let token = jwt.sign({iss:user._id}, process.env.JWT_SECRET, {expiresIn:EXPIRATION_IN_SECOND});
        res.send({
          expiresAt : jwt.decode(token).exp,
          token     : token
        });
      }else{
        res.sendStatus(400);
      }
    })
})

//create user
app.post('/users', (req, res, next) => {

  let user = new User(req.body);
  user.save()
    .then(user => res.status(201).send(user._id))
    .catch(err => next(err));
})

//modify user
app.put('/users/:id', function(req, res, next){
  User.findOne({_id:req.params.id})
    .then(user => {
      if(user){
        _.assign(user, req.body);
        return user.save();
      }else{
        next(new Error('wrong id'));
      }
    })
    .then(user => res.status(201).send(user))
    .catch(err => next(err)) ;
})

const fs = require('fs')
app.post('/videos/:id/token', (req, res) => {
  
  console.log(req.body);
  let cert = fs.readFileSync('private.key')
  let token = jwt.sign(Object.assign({id:req.params.id}, req.body), cert, {algorithm:'RS256'});
  res.send({token:token});

})
