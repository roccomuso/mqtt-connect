'use strict'
var debug = require('debug')('mqtt-connect:Middleware')
var match = require('mqtt-match')

class Middleware {
  constructor (topic, fn) {
    this.hasTopic = typeof topic !== 'function'
    this.topic = (this.hasTopic) ? topic : null
    this.fn = this.hasTopic ? fn : topic

    var self = this

    this.incomingMsg = function () {
      debug('New incoming msg')
      // fn<param>, Client: client, msg, next
      // fn<param>, Broker: broker, client, packet, next
      var msgTopic = (arguments.length === 3) ? arguments[1].topic : arguments[2].topic
      var next = (arguments.length === 3) ? arguments[2] : arguments[3]
      if (self.hasTopic && match(self.topic, msgTopic)) {
        debug('topic match, executing middleware on', self.topic)
        return self.fn.apply(self.fn, arguments)
      }
      if (!self.hasTopic) {
        debug('Executing general middleware')
        return self.fn.apply(self.fn, arguments)
      }
      if (next) next()
    }

    return this.incomingMsg
  }

  getFunc () {
    return this.incomingMsg
  }
}

module.exports = Middleware
