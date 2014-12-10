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

  app.get('/i500', function* (){
    this.status = 500;
  });

  app.get('/haveparams/:foo', function*() {
    this.body = {foo: this.params.foo};
  });

  app.post('/hurp', function* () {
    this.set('x-some-dumb-header', 'Im-set-yo');
    this.body = this.request.body;
  });
  return http.createServer(app.callback())
}

describe('pixie-proxy', function() {
  it('sets the status correctly', function(done) {
    // test server to hit with our requests
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(router(app));

      var proxy = pixie({host: 'http://localhost:' + PORT});

      // we proxy to a non-existent endpoint so we should 404
      app.get('/foo', proxy('/i500'));
      supertest(http.createServer(app.callback()))
        .get('/foo')
        .expect(500)
        .end(function(err, res) {
          assert.ifError(err);
          testServer.close();
          done();
        });
    });
  });

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

  it('proxies the whole url when called with no arguments', function(done) {
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(body());
      app.use(router(app));

      var proxy = pixie({host: 'http://localhost:' + PORT});
      var postBody = {bestHobbit: 'Yolo Swaggins'};

      app.post('/hurp', proxy());
      supertest(http.createServer(app.callback()))
        .post('/hurp')
        .send(postBody)
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          testServer.close();
          done();
        });
    });
  });

  it('proxies POST requests', function(done) {
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(body());
      app.use(router(app));

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
          assert.equal(res.headers['x-some-dumb-header'], 'Im-set-yo');
          testServer.close();
          done();
        });
    });
  });

  it('replaces path params with their this.params', function(done) {
    var testServer = makeTestServer();
    var PORT = getRandomPort();
    testServer.listen(PORT, function() {

      var app = koa();
      app.use(body());
      app.use(router(app));

      var proxy = pixie({host: 'http://localhost:' + PORT});

      app.get('/haveparams/:hurp', proxy('/haveparams/:hurp'));
      supertest(http.createServer(app.callback()))
        .get('/haveparams/bar')
        .expect(200)
        .end(function(err, res) {
          assert.ifError(err);
          assert.deepEqual(res.body, {foo: 'bar'});
          testServer.close();
          done();
        });
    });
  });
});
