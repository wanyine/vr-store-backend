'use strict'
const bcrypt=require('bcrypt-nodejs');
const mongoose   = require('mongoose');
mongoose.Promise = global.Promise;

const userSchema = new mongoose.Schema({
  name     : {type : String, default  : 'vr', unique : true},
  password : {type : String, required : true}
});

userSchema.pre('save', function(next){

  if(this.isModified('password')){
    this.password = bcrypt.hashSync(this.password);
  }
  next();
  
})

userSchema.methods.comparePassword = function(pwd){
  return bcrypt.compareSync(pwd, this.password);
}

exports.User = mongoose.model('users', userSchema);

exports.Item = mongoose.model('items', {title : {type:String, default:'luna'}});
