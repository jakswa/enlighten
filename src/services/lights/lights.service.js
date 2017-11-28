// Initializes the in-memory `lights` service on path `/lights`
const MemoryService = require('feathers-memory').Service;
const hooks = require('./lights.hooks');
const huejay = require('huejay');
const colors = require('../colors');
const SETTABLE = [
  'on', 'xy', 'name', 'brightness', 'colorTemp',
  // fake attribute used to stop bad behavior
  'locked'
];

class LightsService extends MemoryService {
  setup(app) {
    this.app = app;
    // init huejay client
    this.initClient().then(() => {
      // once bridge discovered, start 30s timer to sync the lights
      this.syncLights();
      this.syncIntervalId = setInterval(() => {
        this.syncLights();
      }, 5000);
    });
  }

  patch(id, data, params) {
    return this.client.lights.getById(id).then((light) => {
      if (!light.on && !data.on) {
        throw new Error('light is off. turn it on first');
      }
      if (colors.PRESETS[data.color]) {
        data.xy = colors.presetToXY(data.color);
        delete data.color;
      }
      if (data.rgb) {
        data.xy = colors.toXY(data.rgb);
        delete data.rgb;
      }
      let newAttrs =  this.attrsFrom(data);
      for(var i in newAttrs) {
        light[i] = newAttrs[i];
      }
      return this.client.lights.save(light);
    }).then(savedLight => {
      return super.patch(id, this.attrsFrom(savedLight), params);
    });
    // after huejay, ^ update the in-memory data
  }

  syncLights() {
    this.client.lights.getAll().then(lights => {
      this.setStore(lights)
        .then(() => this.app.emit('lights_sync_done'));
    });
  }

  setStore(lights) {
    // create an iterable-watching promise
    return Promise.all(lights.map((light) => {
      let newAttrs = this.attrsFrom(light);
      this.find({query: {id: light.id}}).then(res => {
        let storedLight = res.data[0];
        if (storedLight) {
          this.updateLight(storedLight, newAttrs);
        } else {
          // pluck the attrs we care about from the light
          // create (and return the promise for) the light
          newAttrs.id = light.id;
          this.create(newAttrs);
        }
      });
    }));
  }

  updateLight(storedLight, newAttrs) {
    let changed = false;
    for(var i in newAttrs) {
      if (i == 'xy') {
        if (LightsService.xyDiff(newAttrs.xy, storedLight.xy)) {
          console.log("found change", i);
          storedLight[i] = newAttrs[i];
          changed = true;
        }
      } else if (storedLight[i] != newAttrs[i]) {
        console.log("found change", i);
        storedLight[i] = newAttrs[i];
        changed = true;
      }
    }
    if (changed) {
      this.update(storedLight.id, storedLight);
    }
  }

  // was seeing small adjustments to XY >_<
  static xyDiff(a, b) {
    for(var i in a) {
      if (Math.abs(a[i] - b[i]) > 0.01) return true;
    }
  }

  static arrayDiff(a, b) {
    for(var i in a) {
      if (a[i] !== b[i]) return true;
    }
  }

  // given an object/hash, pluck only the settable attrs
  attrsFrom(data) {
    return SETTABLE.reduce((a,k) => {
      if (data[k] !== undefined) {
        a[k] = data[k];
      }
      return a;
    }, {});
  }

  initClient() {
    if (!process.env.BRIDGE_IP) {
      console.log("No BRIDGE_IP env var. Discovering bridge...");
      return this.discoverBridge();
    }
    this.client = new huejay.Client({
      host: process.env.BRIDGE_IP,
      username: process.env.HUE_USER
    });
    return Promise.resolve(this.client);
  }

  discoverBridge() {
    return huejay.discover().then(bridges => {
      console.log("Bridge found! Bridge: ", bridges[0] || '<what?>');
      this.client = new huejay.Client({
        host: bridges[0] && bridges[0].ip,
        username: process.env.HUE_USER
      });
    });
  }
}

module.exports = function (app) {

  const paginate = app.get('paginate');

  const options = {
    name: 'lights',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/lights', new LightsService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('lights');

  service.hooks(hooks);
};
