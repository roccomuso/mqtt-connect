'use strict'
var debug = require('debug')('mqtt-connect:MQTTClient')
var each = require('async-each-series')
var Middleware = require('./Middleware')

class MQTTClient {
  constructor (client) {
    var self = this
    this.middlewares = []
    this.client = client
    this.fn = function (topic, msg) {
      var oldMsg = msg
      msg = {
        topic: topic,
        data: oldMsg
      }
      debug('Executing middlewares chain')
      each(self.middlewares, function (middl, next) {
        middl.call(middl, self.client, msg, next)
      })
    }
    this.stack = this.fn
  }

  use (topic, fn) { // fn = client, msg, next
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

module.exports = MQTTClient
