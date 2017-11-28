const assert = require('assert');
const app = require('../../src/app');

describe('\'lights\' service', () => {
  it('registered the service', () => {
    const service = app.service('lights');

    assert.ok(service, 'Registered the service');
  });
});
