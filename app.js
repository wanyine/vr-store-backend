'use strict'

const express    = require('express');
const bodyParser = require('body-parser');
// const rainbow    = require('rainbow');
const jwt = require('jsonwebtoken');
const expressJwt= require('express-jwt');
const fs = require('fs')
const moment = require('moment')

const axios = require('axios')

const client = axios.create({
  baseURL:"https://keen-test.wilddogio.com",
  timeout:5000
})

client.interceptors.request.use(config =>
  Object.assign(config, {url:`${config.url}.json`})
)

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

// Login 
app.post('/tokens', (req, res, next) => {
  client.get(`/users/${req.body.name}`)
  .then(reply => {
      if(reply.data && reply.data.password == req.body.password){
        let token = jwt.sign({iss:req.body.name}, jwt_secret, {expiresIn:EXPIRATION_IN_SECOND});
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

app.get('/records', (req, res, next) => {

  const {start=moment().startOf('day').toDate().getTime(), end=moment.now()} = req.query

  console.log(start, end)

  client.get(`/records/${req.user.iss}`, {params:{
    orderBy:'"$key"',
    startAt:`"${start}"`,
    endAt:`"${end}"`
  }})
  .then(reply => res.send(reply.data))
  .catch(next)
})

app.patch('/records/:id', (req, res, next) => {

  client.patch(`/records/${req.user.iss}/${req.params.id}`, req.body)
  .then(reply => res.send(reply.data))
  .catch(next)

})

app.post('/records', (req, res, next) => {

  const recordKey = Date.now()
  client.put(`/records/${req.user.iss}/${recordKey}`, req.body)
  .then(reply => {
    res.send({
      token:jwt.sign(req.body, PRIVATE_KEY, {algorithm:'RS256'}),
      id : recordKey
    })
  })
  .catch(next)
})

// rainbow.route(app);
const PORT = process.env.PORT || 80
app.listen(PORT, err => console.log(`listen on ${PORT}`));
module.exports = app;
