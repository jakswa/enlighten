const socket = io();
const client = feathers();
client.configure(feathers.hooks());
client.configure(feathers.socketio(socket));

const plugs = client.service('plugs');
const lights = client.service('lights');

plugs.on('created', message =>
  console.log(`New message from ${message.id}: ${message.text}`)
);

// Create a test message
plugs.create({
  text: 'Hello world!'
});

document.addEventListener('DOMContentLoaded', () => {
  plugs.find().then(page => console.log('Current plugs are', page));

});


function updateLights() {
  lights.find().then(page => {
    document.querySelector('lights-list').innerHTML = page.data.map(lightHTML)
  });
}


function lightHTML(light) {
    let degrees = Math.floor(light.hue / 65536 * 360);
    let saturation = Math.floor(light.saturation / 255 * 100).toString() + '%';
    let lightness = '50%';//Math.floor(light.brightness / 255 * 100).toString() + '%';
    let lightStyle = { backgroundColor:  `hsl(${degrees}, ${saturation}, ${lightness})` };
    return `<li key=${light.id} style=${lightStyle}>
      <button onClick="toggleLight(${light.id})">Toggle</button>
      <em>${light.name}</em> ${light.hue}
    </li>`;
  }
