const EventEmitter = require('events').EventEmitter
const ssh2 = require('ssh2')

module.exports = class Connection extends EventEmitter {

  constructor (options) {
    super()

    this._state = null
    this._socket = null

    this.options = this._mergeDefaults(options)
  }

  isReady () {
    return this._state === 'ready' && (this._socket != null)
  }

  connect () {
    if (this._socket != null && this._socket._state === 'ready') {
      return
    }

    this._socket = new ssh2.Client()

    this._socket._state = 'connecting'

    this._bindSocketEvents()

    return this._socket.connect(this.options)
  }

  disconnect () {
    const ref = this._socket
    return ref != null ? ref.end() : void 0
  }

  _mergeDefaults (options) {

    if (options == null) {
      options = {}
    }

    const defaults = {
      host: 'localhost',
      port: 22,
      forceIPv4: false,
      forceIPv6: false,
      hostHash: null,
      username: 'root',
      password: null,
      privateKey: null,
      passphrase: null,
      tryKeyboard: false,
      keepaliveInterval: 0,
      keepaliveCountMax: 3,
      readyTimeout: 20 * 1000,
      debug: false
    }
    return Object.assign({}, defaults, options)
  }

  _setState (state, message) {
    if (state == null) {
      state = 'initialized'
    }
    this._state = state
    return this.emit(state, message)
  }

  _bindSocketEvents () {
    this._socket.on('ready', () => {
      this._socket._state = 'ready'
      return this._setState('ready')
    })

    this._socket.on('error', (err) => {
      this._socket._state = 'failed'
      return this._setState('error', err)
    })

    this._socket.on('end', () => {
      this._socket._state = 'closed'
      return this._setState('closed')
    })
  }
}