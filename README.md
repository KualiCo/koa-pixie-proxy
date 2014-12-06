#pixie-proxy

A dirt-simple composable [koajs](https://github.com/koajs/koa) proxy.

## Installation

```bash
npm i --save pixie-proxy
```


## Usage

```JavaScript
var pixie = require('pixie-proxy');
var koa = require('koa');
var router = require('koa-router');

var app = koa();
app.use(router(app));

var proxy = pixie({host: 'http://example.com'});

// Proxy requests to server/hurp to example.com/durp
app.get('/hurp', proxy('/durp'));

// works with url params as long as they match the url params
// in the request to your server
app.get('some/:param/here/:id', proxy('someother/:param/maybesomethingelse/:id/durp'));

// if you leave out a url it proxies to host + this.url
app.post('/foobar', proxy());
```
