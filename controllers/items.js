
const {Item} = require('../models');

exports.GET=function(req, res){
  console.log(req.user);
  res.send('query items');
}
exports.POST =function(req, res){
  let item = new Item();
  item.save(function(err){
    if(err){
      console.log(err);
    }else{
      res.status(201).send(item._id);
    }
  });
}
// exports.GET.filters = ['authentication'];

