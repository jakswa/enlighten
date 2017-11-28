const plugs = require('./plugs/plugs.service.js');
const lights = require('./lights/lights.service.js');
module.exports = function (app) {
  app.configure(plugs);
  app.configure(lights);
};
