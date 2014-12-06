var assert = require('assert');
var replacePathParams = require('../lib/replace');

describe('replacePathParams', function() {
  it('takes an express path string and a params object, and returns a new path with the params filled in', function() {
    var params = {
      foo: 'bar',
      baz: 'beans'
    };
    var path = '/hurp/:foo/:baz/whatever';
    assert.equal(replacePathParams(path, params), '/hurp/bar/beans/whatever');
  });
});
