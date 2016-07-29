'use strict'

const express    = require('express');
const bodyParser = require('body-parser');
const mongoose   = require('mongoose');
const rainbow    = require('rainbow');
const expressJwt= require('express-jwt');
const app = express();
app.use(bodyParser.json({limit:'1mb'}));
app.use(bodyParser.urlencoded({extended:false}));
app.use(expressJwt({secret:process.env.JWT_SECRET}).unless({path:['/token', '/users']}));
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

rainbow.route(app);
app.listen(process.env.PORT || 80);
