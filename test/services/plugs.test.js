const assert = require('assert');
const app = require('../../src/app');

describe('\'plugs\' service', () => {
  it('registered the service', () => {
    const service = app.service('plugs');

    assert.ok(service, 'Registered the service');
  });
});
