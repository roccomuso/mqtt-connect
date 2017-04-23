# mqtt-connect [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

MQTT high level framework to glue together various "middleware" to handle incoming messages.

**It works for both MQTT Broker and Client.**



## Broker Example

```javascript
var mosca = require('mosca')
var MQTTConnect = require('mqtt-connect')

var settings = {
  port: 1883,
  backend: {
    type: 'mongo',
    url: 'mongodb://localhost:27017/mqtt',
    pubsubCollection: 'ascoltatori',
    mongo: {}
  }
}

var server = new mosca.Server(settings);
var app = new MQTTConnect.broker(server)

server.on('clientConnected', function(client) {
    console.log('client connected', client.id)
})

app.use('/topic', function(client, broker, packet, next){
  // middleware
  console.log(packet.payload)
  next()
})

// fired when a message is received
server.on('published', app.stack) // fn(packet, client)

```

## Client Example

```javascript
var mqtt = require('mqtt')
var MQTTConnect = require('mqtt-connect')

var client  = mqtt.connect('mqtt://test.mosquitto.org')

client.on('connect', function () {
  client.subscribe('presence')
  client.publish('presence', 'Hello mqtt')
})

var app = new MQTTConnect.Client(client)

app.use(function middleware1(client, msg, next) {
  // middleware 1
  next()
})

app.use(function (client, msg, next) {
  // middleware 2
  console.log(msg.topic)
  console.log(msg.data) // buffer
  client.publish('boop/', 'boop')
})

client.on('message', app.stack) // fn(topic, msg)

```


### Mount middleware

The `.use()` method also takes an optional path string that is matched against the beginning of the incoming request topic. This allows for basic msg routing:

```javascript
app.use('/topic1', function fooMiddleware(client, msg, next) {

  next()
})
```
