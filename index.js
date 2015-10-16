var request = require('co-request');
var replacePathParams = require('./lib/replace');
var debug = require('debug')('koa-pixie-proxy');

var hasColons = /:/;

function pixie(options) {
  options.hostHeader = options.hostHeader || options.host.replace(/^https?:\/\//, '');
  
  return function proxy(path, encoding) {
    var shouldReplacePathParams = hasColons.test(path);

    return function* (next) {
      var self = this;
      
      var requestHeaders = {};
      Object.keys(self.headers).forEach(function(h) {
        if (h === 'host') requestHeaders[h] = options.hostHeader;
        else requestHeaders[h] = self.headers[h];
      });

      var requestOpts = {
        url: options.host + (path || this.url),
        method: this.method,
        headers: requestHeaders,
        qs: this.query,
        encoding: encoding
      };

      // a request's 'host' header should match the
      // server's dns name -- this is particularly
      // important for https destinations
      requestOpts.headers.host = options.hostHeader

      // if we have dynamic segments in the url
      if (shouldReplacePathParams) {
        requestOpts.url = options.host + replacePathParams(path, this.params);
      }

      // something possibly went wrong if they have no body but are sending a
      // put or a post
      if ((requestOpts.method == 'POST' || requestOpts.method == 'PUT')) {

        if (!this.request.body) {
          console.warn('sending PUT or POST but no request body found');
        } else {
          requestOpts.body = this.request.body;
        }

        // make request allow js objects if we are sending json
        if (this.request.type == 'application/json') {
          requestOpts.json = true;
        }

      }

      debug('proxying request with options', requestOpts);

      var response = yield request(requestOpts);

      // Proxy over response headers
      Object.keys(response.headers).forEach(function(h) {
        self.set(h, response.headers[h]);
      });
      this.status = response.statusCode;
      this.body = response.body;

      yield next;
    }
  }
}

module.exports = pixie;
