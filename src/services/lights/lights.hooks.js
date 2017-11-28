const colors = require('../colors');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    // FUUUUU everything is preventing me from getting accurate colors in UI
    all: [function(hook) {
      if(hook.result && hook.result.xy) {
        hook.result.rgb = colors.toRGB(hook.result.xy, hook.result.brightness);
      } else if (hook.result.data && hook.result.data.length && hook.result.data[0].xy) {
        hook.result.data.forEach(i => i.rgb = colors.toRGB(i.xy, i.brightness));
      }
    }],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
