'use strict'
var debug = require('debug')('mqtt-connect:MQTTBroker')
var each = require('async-each-series')
var Middleware = require('./Middleware')

class MQTTBroker {
  constructor (broker) {
    var self = this
    this.middlewares = []
    this.broker = broker
    this.fn = function (packet, client) {
      debug('Executing middlewares chain')
      each(self.middlewares, function (middl, next) {
        middl.call(middl, self.broker, client, packet, next)
      })
    }
    this.stack = this.fn
  }

  use (topic, fn) { // fn = broker, client, packet, next
    debug('Adding middleware', (typeof topic === 'string' ? 'to ' + topic : ''))
    this.middlewares.push(new Middleware(topic, fn))
    return this /* allow method chaining */
  }

  getCount () {
    return this.middlewares.length
  }

  reset () {
    this.middlewares = []
    return this /* allow method chaining */
  }
}

module.exports = MQTTBroker
