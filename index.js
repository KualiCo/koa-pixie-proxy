var request = require('co-request');
var replacePathParams = require('./lib/replace');
var debug = require('debug')('pixie-proxy');

var hasColons = /:/;

function pixie(options) {
  return function proxy(path) {
    var shouldReplacePathParams = hasColons.test(path);

    return function* (next) {
      var self = this;

      var requestOpts = {
        url: options.host + path || this.url,
        method: this.method,
        headers: this.headers
      };

      // if we have dynamic segments in the url
      if (shouldReplacePathParams) {
        requestOpts.url = option.host + replacePathParams(path, this.params);
      }

      // something possibly went wrong if they have no body but are sending a
      // put or a post
      if ((requestOpts.method == 'POST' || requestOpts.method == 'PUT') && !this.request.body) {
        console.warn('sending PUT or POST but no request body found');
      }

      // LOL WE JSON NOW
      if (this.request.body) {
        requestOpts.json = true;
        requestOpts.body = this.request.body;
      }

      debug(requestOpts);

      var response = yield request(requestOpts);
      debug(response);

      // Proxy over response headers
      Object.keys(response.headers).forEach(function(h) {
        self.set(h, response.headers[h]);
      });
      this.body = response.body;

      yield next;
    }
  }
}

module.exports = pixie;
