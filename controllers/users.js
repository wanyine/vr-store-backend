
const _ = require('lodash');
const {User} = require('../models')

exports.GET=function(req, res){
  res.send('query users');
}

exports.POST = (req, res, next) => {

  let user = new User(req.body);
  user.save()
    .then(user => res.status(201).send(user._id))
    .catch(err => next(err));
  ;
}

exports.PUT = function(req, res, next){
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
}

exports.PUT.params = ':id?';
