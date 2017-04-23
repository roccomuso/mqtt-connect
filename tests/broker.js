var test = require('tape')
var EventEmitter = require('events').EventEmitter
var MQTTBroker = require('../lib').Broker

/* Simulate incoming Msg */
var server = new EventEmitter()
var app = new MQTTBroker(server)
server.on('message', app.stack)

var sampleClient = {} // sample client

test('MQTTBroker basic', function (t) {
  t.plan(24) // plan assertions

    // declare middleware with no-topic.
  app.use(function (broker, client, packet, next) {
    t.ok(broker, 'broker exists')
    t.ok(client, 'client exists')
    t.ok(packet.payload, 'msg has data prop.')
    t.ok(packet.topic, 'msg has topic prop.')
    t.equal(typeof next, 'function', 'next is a function')
    next()
  })
    // mount middleware with topic.
  app.use('/hello', function (broker, client, packet, next) {
    t.ok(packet.topic, '/hello')
    t.equal(packet.payload, 'mex', 'got the right msg data from /hello')
    next()
  })
    // should not receive msg on a different topic.
  app.use('/stayaway', function (broker, client, packet, next) {
    t.fail('should not be reached! nobody publish in /stayaway')
  })
    // should edit a given msg obj (+1).
  app.use('/compute', function (broker, client, packet, next) {
    t.equal(packet.topic, '/compute', 'got msg on the /compute topic')
    t.equal(packet.payload, 1, 'got 1 on /compute')
    packet.payload++
    next()
  })
    // should retrieve that changed msg obj previously edited
  app.use('/compute', function (broker, client, packet, next) {
    t.equal(packet.topic, '/compute')
    t.equal(packet.payload, 2, 'msg data changed from prev. middleware')
    next()
  })
    // Should return exactly X middlewares
  t.equal(app.getCount(), 5, 'got 5 middlewares')
    // Istantiate 3 middlewares.
  app.use('/no/next', function (broker, client, packet, next) {
    t.equal(packet.topic, '/no/next', 'Reached the /no/next middl.') // reached once
      // no next()
  }).use('/no/next', function (broker, client, packet, next) {
      // never reached
    t.fail('should not be reached! missing next() statement in the prev. middleware')
  }).use('/no/next', function (broker, client, packet, next) {
      // never reached
    t.fail('should not be reached! missing next() statement in the prev. middleware')
  })
    // The 1th one won't call next()
    // expect the 2th and 3th not to be reached.

    // Should return X middlewares
  t.equal(app.getCount(), 8, 'got 8 middlewares')

  setTimeout(function () {
    server.emit('message', {payload: 'mex', topic: '/hello'}, sampleClient)
    server.emit('message', {payload: 1, topic: '/compute'}, sampleClient)
    server.emit('message', {payload: 1, topic: '/no/next'}, sampleClient)
  }, 1000)
})

test('MQTTBroker API', function (t) {
  t.plan(4)

    // app.use should be a function
  t.equal(typeof app.use, 'function', 'app.use is a function')
    // app.stack should be a function
  t.equal(typeof app.stack, 'function', 'app.stack is a function')
    // reset app
  app.reset()
    // istantiate a middl.
  app.use(function (broker, client, packet, next) {
    next()
  })
    // Should return exactly 1 middleware
  t.equal(app.getCount(), 1)
    // Should reset the loaded middlewares
  app.reset()
    // Should return exactly 0 middlewares
  t.equal(app.getCount(), 0)
})

test('MQTTBroker topic and wildcards', function (t) {
  t.plan(6)

  app.reset()
  // '/' never reached
  app.use('/', function (broker, client, packet, next) {
    t.fail(packet.topic, 'nobody published here')
  })
  // /hello/#
  app.use('/deep/#', function (broker, client, packet, next) {
    t.equal(packet.topic, '/deep/hello/world', '# wildcard works')
    next()
  })
  app.use('/deeper/#', function (broker, client, packet, next) {
    t.equal(packet.payload, 'boo', '# got boo on /deep/hello/world/more/deeper')
    next()
  })
  // /hello/+
  app.use('/hello/+', function (broker, client, packet, next) {
    t.equal(packet.topic, '/hello/world', '+ wildcard works')
    next()
  })
  app.use('/world/+', function (broker, client, packet, next) {
    t.equal(packet.payload, 'ok', '+ wildcard works')
    next()
  })

  t.equal(app.getCount(), 5) // +1

  setTimeout(function () {
    server.emit('message', {topic: '/deep/hello/world', payload: 'boo'}, sampleClient) // +1
    server.emit('message', {topic: '/deeper/hello/world/more/more/more', payload: 'boo'}, sampleClient) // +1
    server.emit('message', {topic: '/hello/world', payload: 'foo'}, sampleClient) // +1
    server.emit('message', {topic: '/hello', payload: 'sorry'}, sampleClient) // no catch
    server.emit('message', {topic: '/world/catched', payload: 'ok'}, sampleClient) // +1
    server.emit('message', {topic: '/world/catched', payload: 'ok'}, sampleClient) // +1
    server.emit('message', {topic: '/world/no/catched', payload: 'no'}, sampleClient) // no catch
  }, 1000)
})

test('MQTTBroker middlewares order', function (t) {
  t.plan(2)

  app.reset()

    // Order counts: every middleware adds a progressive letter.
  for (var i = 66; i < 123; i++) {
    (function (i) {
      app.use('#', function (broker, client, packet, next) {
        packet.payload = (typeof packet.payload === 'string' ? packet.payload : '') + String.fromCharCode(i)
        next()
      })
    })(i)
  }
    // last middleware
  app.use(function (broker, client, packet, next) {
    console.log('got final string:', packet.payload)
      // expect final string
    t.equal(packet.payload, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz', 'Final string built by middlewares match')
    next()
  })

  t.equal(app.getCount(), 58, 'Got 58 middlewares instantiated')

  setTimeout(function () {
    server.emit('message', {topic: 'helloTopic', payload: 'A'}, sampleClient)
  }, 1000)
})
