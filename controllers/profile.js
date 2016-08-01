
const _ = require('lodash');
const {User} = require('../models')

exports.GET=function(req, res){
  res.send('query prifle');
}
exports.POST = (req, res) => {
  User.update({_id:req.user.iss}, {$set:req.body}, err => console.log(err));
  res.sendStatus(201);
}
