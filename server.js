// server.js
const http = require('http');
const WebSocket = require('ws');
const mqtt = require('mqtt');

const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC = 'demo/iot/sensor1';

const mqttClient = mqtt.connect(MQTT_BROKER);
const server = http.createServer();
const wss = new WebSocket.Server({ server });

mqttClient.on('connect', () => {
  console.log('MQTT connected');
  mqttClient.subscribe(MQTT_TOPIC);
});

mqttClient.on('message', (topic, message) => {
  // Khi nhận message từ device, broadcast tới tất cả WebSocket client
  const msg = message.toString();
  console.log('MQTT msg', msg);
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) ws.send(msg);
  });
});

wss.on('connection', ws => {
  console.log('WS client connected');
  ws.send(JSON.stringify({ msg: 'welcome' }));
});

server.listen(3000, () => console.log('Server listening on http://localhost:3000'));
