var request = require('co-request');
var replacePathParams = require('./lib/replace');

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

      // LOL WE JSON NOW
      if (this.request.body) {
        requestOpts.json = true;
        requestOpts.body = this.request.body;
      }

      var response = yield request(requestOpts);

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
