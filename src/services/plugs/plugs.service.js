// Initializes the `plugs` service on path `/plugs`
const KnexService = require('feathers-knex').Service;
const createModel = require('../../models/plugs.model');
const hooks = require('./plugs.hooks');

class PlugsService extends KnexService {
}

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'plugs',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/plugs', new PlugsService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('plugs');

  service.hooks(hooks);
};
