const socket = io();
const client = feathers();
client.configure(feathers.hooks());
client.configure(feathers.socketio(socket));

const plugs = client.service('plugs');
const lights = client.service('lights');

plugs.on('created', message => {
  console.log(`New message from ${message.id}: ${message.text}`)
});
lights.on('patched', light => {
  console.log(`New *patch* from ${light.name}, ${JSON.stringify(light)}`)
  LightClient.updateLight(light)
});
lights.on('updated', light => {
  console.log(`New update from ${light.name}, ${JSON.stringify(light)}`)
  LightClient.updateLight(light)
});

// Create a test message
plugs.create({
  text: 'Hello world!'
});

document.addEventListener('DOMContentLoaded', () => {
  plugs.find().then(page => console.log('Current plugs are', page));
  LightClient.updateLights();
});


class LightClient {
  static toggleLight(id) {
    let light = this.lightCache.find(i => i.id == id);
    if (!light) return;
    light.on = !light.on;
    lights.patch(id, {on: light.on});
  }

  static setBrightness(id) {
    let val = document.querySelector('li[light-id="' + id + '"] input[name="brightness"]');
    val = val && val.value;
    let light = this.lightCache.find(i => i.id == id);
    lights.patch(id, {brightness: val});
  }

  static setColor(id) {
    let val = document.querySelector('li[light-id="' + id + '"] input[name="color"]');
    val = val && val.value;
    if (!val || !val.match(/^[0-9a-f]{6}$/)) return;
    let light = this.lightCache.find(i => i.id == id);
    lights.patch(id, {rgb: val});
  }

  static updateLight(light) {
    let list = document.querySelector('#lights-list')
    var existing;
    for(var i = 0; i < list.children.length; i++) {
      if (list.children[i].getAttribute('light-id') == light.id) {
        existing = list.children[i]
      }
    }
    let newElement = this.lightElement(light);
    if (existing) {
      list.replaceChild(newElement, existing);
    } else {
      list.append(newElement);
    }
  }

  static updateLights() {
    lights.find().then(page => {
      this.lightCache = page.data;
      let list = document.querySelector('#lights-list');
      page.data.map(this.lightElement)
        .forEach(i => list.append(i));
    });
  }


  static lightElement(light) {
    let ele = document.createElement('li');
    ele.style = `border-color: #${light.rgb}; background-color: #${light.rgb + '33'};`;
    ele.setAttribute('light-id', light.id);
    if (light.on) ele.classList.add('power-on');
    ele.innerHTML = `
      <a class="toggle" onclick="LightClient.toggleLight(${light.id})">⚡</a>
      <input name="color" type="text" onchange="LightClient.setColor(${light.id})"
        value="${light.rgb}" ${light.on ? '' : 'disabled="disabled"'}"></input>
      <input name="brightness" type="range" onchange="LightClient.setBrightness(${light.id})"
        min="0" max="255"
        value="${light.brightness}" ${light.on ? '' : 'disabled="disabled"'}"></input>
      <b>${light.name}</b>
    `;
    return ele;
  }
}
