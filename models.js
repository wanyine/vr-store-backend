'use strict'

const mongoose   = require('mongoose');
const log4js = require('log4js')

const logger = log4js.getLogger('vr-store-backend')
mongoose.Promise = global.Promise;

const port     = process.env.MONGODB_PORT_27017_TCP_PORT || 27017;
const addr     = process.env.MONGODB_PORT_27017_TCP_ADDR || '127.0.0.1';
const instance = process.env.MONGODB_INSTANCE_NAME || 'test';
const password = process.env.MONGODB_PASSWORD;
const username = process.env.MONGODB_USERNAME;
const auth = !!username ? username + ':' + password  + '@' : '';
mongoose.connect('mongodb://' + auth + addr + ':' + port + '/' + instance);
mongoose.connection.on('error', err=> logger.error(err));
mongoose.connection.on('disconnected', ()=> logger.error('mongodb disconnected'));
process.on('SIGINT', () => {
  mongoose.connection.close(()=> {
    logger.info('interrupted, db closed');
    process.exit(-1);
  });
})


const RecordSchema = new mongoose.Schema({
  created:{type:Date, default:Date.now},
  videoName:{type:String, required:true},
  userId:{type:mongoose.Schema.Types.ObjectId, required:true},
  version:{type:String},
  mac:{type:String},
  time:{type:Number}
// }, {
//   _id:false,
})

const UserSchema = new mongoose.Schema({
  name     : {type : String, required : true, unique : true},
  password : {type : String, required : true},
  records:[RecordSchema],
});


const VersionSchema = new mongoose.Schema({
  number:{type:String},
  updated:{type:Date, default:Date.now},
  size:{type:Number}
}, {
  _id:false,
})

const VideoSchema = new mongoose.Schema({
  name     : {type: String, required: true, unique : true},
  type     : {type: String, required: true},
  cover    : {type: String}, //cover image url
  latest:{type:String},
  versions : [VersionSchema]
});

exports.User = mongoose.model('users', UserSchema);
exports.Record = mongoose.model('user.records', RecordSchema);
exports.Version = mongoose.model('video.versions', VersionSchema);
exports.Video = mongoose.model('videos', VideoSchema);
