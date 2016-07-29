'use strict'

const jwt = require('jsonwebtoken');
// const moment = require('moment');
const {User} = require('../models');

const EXPIRATION_IN_SECOND = 3

exports.POST = (req, res) => {
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
}
