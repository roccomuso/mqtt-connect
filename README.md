# mqtt-connect [![NPM Version](https://img.shields.io/npm/v/mqtt-connect.svg)](https://www.npmjs.com/package/mqtt-connect) [![Build Status](https://travis-ci.org/roccomuso/mqtt-connect.svg?branch=master)](https://travis-ci.org/roccomuso/mqtt-connect) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

MQTT high level framework to glue together various "middleware" to handle incoming messages.

**It works for both MQTT Broker and Client.**

Heavily inspired by the HTTP [connect](https://github.com/senchalabs/connect) module form-factor.

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

app.use('/topic', function(broker, client, packet, next){
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
  // your middleware logic
  next()
})
```

## API

### app.use(fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every request in the order that `app.use` is called. The function
is called with three arguments for the client and 4 arguments for the Broker:

```js
// Client
app.use(function (client, msg, next) {
  // client is an MQTT client instance
  // msg is an object with 2 property: topic <String>, data <Buffer>
  // next is a function to call to invoke the next middleware
})

// Broker
app.use(function(broker, client, packet, next){
  // broker is a reference to our broker.
  // client is the sender mqtt client.
  // packet is the incoming packet, containes: .topic, .payload etc.
  // next is a function to call to invoke the next middleware
})
```

### app.use(topic, fn)

Use a function on the app, where the function represents a middleware. The function
will be invoked for every packet received in which the TOPIC match with
the given `topic` string in the order that `app.use` is called.

```js
app.use('/foo', function (client, msg, next) {
  // client is an MQTT client instance
  // msg is an object with 2 property: topic <String>, data <Buffer>
  // next is a function to call to invoke the next middleware
})

app.use('/bar/+', brokerCb)
```

The `topic` could be terminated with a path separator (`/`) or an MQTT wildcard character (`+` or `#`).
This means the given topic `/foo/` and `/foo` are NOT the same and both will not match the same messages.

Moreover the `topic` is matched in a case-sensitive manor!

Check the [mqtt-match](https://github.com/ralphtheninja/mqtt-match) module or the MQTT protocol documentation to better understand topic matching.

### app.stack

Expose the function that will iterate through the added middlewares instances.

- For the `Client` could be called with 2 params (`topic`,`msg`).
- For the `Broker` could be called with 2 params (`packet`,`client`).

Common usage:

```js
// Client
client.on('message', app.stack) // fn(topic, msg)

// Broker
server.on('published', app.stack) // fn(packet, client)
```

It's built to be compatible with the [MQTT.js](https://github.com/mqttjs/MQTT.js) Module and the [Mosca](https://github.com/mcollina/mosca) Broker. But it could also be used together with an `EventEmitter` class that emits messages following the same function signature.

### app.getCount()

Returns the number of middlewares currently inside our `MQTTConnect` `Client` or `Broker` instance.

### app.reset()

Removes all the middlewares from our `app`.

## Author

Rocco Musolino ([@roccomuso](https://twitter.com/roccomuso))

## License

MIT
