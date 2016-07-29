
const _ = require('lodash');
const {User} = require('../models')

exports.GET=function(req, res){
  res.send('query prifle');
}
exports.POST = (req, res) => {
  console.log(req.user);
  console.log(req.body);
  User.update({_id:req.user.iss}, {$set:req.body}, err => console.log(err));
  // let user = User.findOne({_id:req.user.iss});
  // user.save(_.assign(user, req.body));
  res.sendStatus(201);
}
// exports.GET.filters = ['authentication'];
