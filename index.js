var request = require('co-request');
var replacePathParams = require('./lib/replace');
var debug = require('debug')('koa-pixie-proxy');

var hasColons = /:/;

function pixie(options) {
  return function proxy(path, encoding) {
    var shouldReplacePathParams = hasColons.test(path);

    return function* (next) {
      var self = this;

      var requestOpts = {
        url: options.host + (path || this.url),
        method: this.method,
        headers: this.headers,
        qs: this.query,
        encoding: encoding
      };

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
