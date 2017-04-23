var debug = require('debug')('mqtt-connect:Middleware')
var match = require('mqtt-match')

class Middleware {
  constructor (topic, fn) {
    this.hasTopic = typeof topic !== 'function'
    this.topic = (this.hasTopic) ? topic : null
    this.fn = this.hasTopic ? fn : topic

    var self = this

    this.incomingMsg = function (client, msg, next) {
      debug('New incoming msg')
      if (self.hasTopic && match(self.topic, msg.topic)) {
        debug('topic match, executing middleware on', self.topic)
        return self.fn(client, msg, next)
      }
      if (!self.hasTopic) {
        debug('Executing general middleware')
        return self.fn(client, msg, next)
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
