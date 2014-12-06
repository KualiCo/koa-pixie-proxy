var pixie = require('../');
var koa = require('koa');
var supertest = require('supertest');
var assert = require('assert');
var http = require('http');
var router = require('koa-router');
var body = require('koa-body');

function getRandomPort() {
  return Math.ceil(Math.random() * 5000 + 5000);
}

function makeTestServer() {
  var app = koa();

  app.use(body());
  app.use(router(app));
  app.get('/hurp', function* (){
    this.body = {hurp: 'durp'}
  });
  app.post('/hurp', function* () {
    console.log('this.request.body is', this.request.body);
    this.body = this.request.body;
    this.set('X-Some-Dumb-Header', 'Im-set-yo');
  });
  return http.createServer(app.callback())
}

describe('pixie-proxy', function() {
  it('proxies GET requests', function(done) {
    // test server to hit with our requests
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(router(app));

      var proxy = pixie({host: 'http://localhost:' + PORT});

      app.get('/foo', proxy('/hurp'));
      supertest(http.createServer(app.callback()))
        .get('/foo')
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          assert.deepEqual(res.body, {hurp:'durp'});
          testServer.close();
          done();
        });
    });
  });

  it('proxies POST requests', function(done) {
    console.log('did i get here');
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(router(app));
      app.use(body());

      var proxy = pixie({host: 'http://localhost:' + PORT});
      var postBody = {bestHobbit: 'Yolo Swaggins'};

      app.post('/foo', proxy('/hurp'));
      supertest(http.createServer(app.callback()))
        .post('/foo')
        .send(postBody)
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          assert.deepEqual(res.body, postBody);
          console.log('res.headers is', res.headers)
          assert.equal(res.headers['X-Some-Dumb-Header'], 'Im-set-yo');
          testServer.close();
          done();
        });
    });
  });
});
