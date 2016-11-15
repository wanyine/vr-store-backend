const auth = require('basic-auth')
const unless = require('express-unless')

function basicAuth(req, res, next){
  var user = auth(req);
  if(user && user.name === process.env.ADMIN_NAME && user.pass  === process.env.ADMIN_PASS){
    return next()
  } else{
    res.setHeader('WWW-Authenticate', 'Basic realm="keenvision.cn" ')
    res.status(401).send()
  }
}

basicAuth.unless = unless

function allowCors(req, res, next){
  res.header("Access-Control-Allow-Origin", process.env.ORIGIN || "http://crm.keenvision.cn")
  res.header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, X-Requested-With");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods","PUT,POST,GET,DELETE,OPTIONS")
  next()
}


module.exports = {basicAuth, allowCors} 
