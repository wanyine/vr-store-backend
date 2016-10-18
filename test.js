'use strict'

process.env.PORT=8888

const should = require('should');
const supertest = require('supertest');
const moment = require('moment');
const app = require('./app');
const request = supertest(app)
const {User, Record, Video} = require('./models')


describe('Test App', () => {

  const fetchToken = () => new Promise((resolve, reject) =>{
      request.post('/tokens')
        .send({name:'test', password:'guess'})
        .expect(200)
        .end((err, res) => {
          if(err){
            reject(err)
          } else {
            resolve(res.body.token)
          }
        })
  })

  const auth = token => req => {
    req.set('Authorization',`Bearer ${token}`)
  }

  before( done =>{
    let user = new User({name:'test', password:'guess'})
    let video = new Video({name:'max', type:'multiple'})
    Promise.all([
      user.save(),
      video.save()
    ])
    .then(values => done()).catch(done)
  })

  after( done => {
    Promise.all([
      User.findOneAndRemove({name:'test'}),
      Video.findOneAndRemove({name:'max'})
    ])
    .then(values => done()).catch(done)
  })

  describe('Users', () => {
    it('should get all', done => {
      request.get('/users')
        .expect(200)
        .expect(res => should(res.body).be.an.Array())
        .expect(res => should(res.body.length).be.ok())
        .end(done)
    })   

    it('should create one and update it and delete it', done => {
      request.post('/users')
      .send({name:'nerd', password:'geek'})
      .expect(201)
      .end((error, response) => {
        if(error){
          done(error)
        } else {
          request.put(`/users/${response.body._id}`)
          .send({password:'pass'})
          .expect(200)
          .expect(res => should(res.body.password).be.exactly('pass'))
          .end((error, response) => {
            if(error){
              done(error)
            } else {
              request.delete(`/users/${response.body._id}`)
              .expect(200)
              .expect(res => should(res.body._id).be.exactly(response.body._id))
              .end(done)
            }
          })
        }
      })
    })
  })

  describe('Display Videos ', () =>{

    it('should be ok', done => {
      fetchToken().then(token => {
        request.get('/videos')
          .use(auth(token))
          .expect(200)
          .expect(res => should(res.body).be.an.Array())
          .end(done)
      })
      .catch(done)
    })
  
  })


  describe('Log In', () =>{
  

    it('should failed if username or password is wrong', done => {
      request.post('/tokens')
        .send({})
        .expect(400, done)
    })

    it('should success', done => {
      request.post('/tokens')
        .send({name:'test', password:'guess'})
        .expect(res => should(res.body.token).be.ok())
        .expect(200, done)
    })

  })

  describe('Records', () =>{
    it('should fail if never logged in', done => {
      request.post('/records')
        .send({mac:'abcd-1234'})
        .expect(401, done)
    })

    it('should fail if token is invalid', done => {
      request.post('/records')
        .use(auth('invalid-token'))
        .send({mac:'abcd-1234'})
        .expect(401, done)
    })

    before(done => {
      Promise.all([
        User.findOne({name:'test'}),
        Video.findOne({name:'max'})
      ])
      .then(([user, video]) => {
        let record = new Record({
          mac:'a1b2', 
          userId:user.id,
          videoName:'max'
        });
        return record.save()
      })
      .then(res => done())
      .catch(done)
    })

    after( done => {
      Record.findOneAndRemove({mac:'a1b2'}, err => done(err) )
    })

    it('should post one record', done => {
      fetchToken()
      .then(token => {
        request.post('/records')
          .use(auth(token))
          .send({mac:'a1b2', videoName:'eclipse'})
          .expect(201)
          .expect(res => should(res.body.id).be.ok())
          .end(done)
      })
      .catch(done)
    })
    it('should patch time for one record', done => {
      Promise.all([
        fetchToken(),
        Record.findOne({mac:'a1b2'})
      ])
      .then(([token, record]) => {
        request.patch(`/records/${record.id}`)
        .use(auth(token))
        .send({time:60})
        .expect(201)
        .expect(res => should(res.body.time).be.exactly(60))
        .end(done)
      })
      .catch(done)
    })

    it('should get record groups', done => {

      fetchToken()
      .then(token => {
        request.get(`/records?days=${1}&groupByDate&beginDay=${moment().format('YYYY-MM-DD')}`)
          // .query({ days:2, beginTime:moment().startOf('day').getTime(), groupByDate:1 })
          .use(auth(token))
          .expect(200)
          .expect(res => should(res.body).be.an.Array())
          .expect(res => should(res.body.length).be.exactly(1))
          .end(done)
      })
      .catch(done)
    
    })

    it('should get daily records', done => {

      fetchToken().then(token => {
        request.get(`/records?beginDay=${moment().format('YYYY-MM-DD')}`)
          // .query({ days:2, beginTime:moment().startOf('day').getTime() })
          .use(auth(token))
          .expect(200)
          .expect(res => should(res.body).be.an.Array())
          .expect(res => should(res.body.length).be.ok())
          .end(done)
      })
      .catch(done)
    
    })
  })
})

