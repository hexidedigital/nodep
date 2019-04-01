const fs = require('fs')
const EventEmitter = require('events').EventEmitter
const Client = require('./client')

module.exports = class Deployer extends EventEmitter {
  constructor (stage, pwd, project_root, logger) {
    super()

    this.pwd = pwd
    this.project_root = project_root

    this.logger = logger != null ? logger : console

    this.stage = stage
    this.clients = {}
    this.tasks = {}
    this.variables = {}

    this.bindEvents()
  }

  bindEvents () {
    this.once('done', () => {
      let keys = Object.keys(this.clients)
      keys.forEach((c) => {
        this.clients[c].disconnect()
      })
    })
  }

  servers (servers) {

    let list = servers.filter((server) => {
      return server.stage === this.stage
    })

    this.readyThreshold = list.length

    list.forEach((options) => {
      this._addServer(options)
    })
  }

  _ready () {
    if (Object.keys(this.clients).length >= this.readyThreshold) {
      return this.emit('ready')
    }
  }

  _addServer (options, callback) {
    if (options == null) {
      return
    }

    options.variables = this.variables

    let client = new Client(options, this.logger)

    client.once('ready', () => {
      this.clients[options.name] = client
      this.logger.log('\u001b[32m' + options.name + '\u001b[39m connected')
      this._ready()
      return typeof callback === 'function' ? callback() : void 0
    })

    client.once('error', (err) => {
      this.logger.log('\u001b[32m' + options.name + '\u001b[39m connect failed', err)
      this.clients[options.name] = null
      return typeof callback === 'function' ? callback() : void 0
    })

    client.once('closed', () => {
      this.logger.log('\u001b[32m' + options.name + '\u001b[39m closed')
      this.clients[options.name] = null
    })

    return client.connect()
  }

  task (name, closure = null, options = {}) {
    if (closure === null) {
      closure = name
    }

    let closureType = typeof closure

    if (closureType === 'function') {

      this.tasks[name] = {
        handler: closure,
        options: options
      }
    } else if (closureType === 'object') {
      closure.forEach((row) => {
        this._loadTaskByName(row, options)
      })

      this.tasks[name] = {
        handler: closure,
        options: options
      }

    } else if (closureType === 'string') {
      this._loadTaskByName(closure)
    } else {
      throw 'Unsupported closure type: ' + closureType
    }
  }

  _loadTaskByName (name, options = {}) {

    // task already registered or loaded
    if (this.taskExists(name)) {
      return this.tasks[name]
    }

    let task, file

    file = name.replace('.', '/')

    if (fs.existsSync(this.pwd + '/deploy/tasks/' + file + '.js')) {
      task = require(this.pwd + '/deploy/tasks/' + file + '.js')
    } else if (fs.existsSync(this.project_root + '/lib/tasks/' + file + '.js')) {
      task = require(this.project_root + '/lib/tasks/' + file + '.js')
    }

    if (typeof task !== 'function') {
      throw 'Cannot read task ' + name
    }

    this.tasks[name] = {
      handler: task,
      options: options
    }

    return this.tasks[name]
  }

  taskExists (name) {
    return this.tasks.hasOwnProperty(name) && typeof this.tasks[name].handler === 'function'
  }

  set (name, value) {
    if (name == null) {
      return
    }

    return this.variables[name] = value
  }

  get (name) {
    return this.variables[name]
  }

  run (name) {

    this.on('ready', () => {
      this.do(name)
        .then(() => {
          this.emit('done')
        })
        .catch((e) => {
          this.emit('done')
          console.error(e);
        })

    })

    this.on('done', () => {console.log('Task "%s" has been completed', name)})
  }

  async do (name) {

    let config = this.tasks[name]

    if (!config) {

      // task with that name doesn't exist yet.
      // lets try to load it by name

      try {
        config = this._loadTaskByName(name)
      } catch (e) {
        console.error('Cannot find task ' + name)
        process.exit(1)
      }
    }

    if (typeof config.handler === 'function') {

      try {
        await this.execOnClients(name, config)
      } catch (e) {
        throw e
      }

    } else {
      // console.log(handler)
      for (const row of config.handler) {
        await this.do(row)
      }
    }

  }

  async execOnClients (name, config) {
    let ref
    let serverNames = Object.keys(this.clients)

    this.logger.log('╭─ Executing task \u001b[32m' + name + '\u001b[39m')
    this.logger.log('╰─➤ on [' + (serverNames.join(', ')) + ']')

    for (const _name of serverNames) {
      if (!((ref = this.clients[_name]) != null ? ref.isReady() : void 0)) {
        return
      }
      try {
        await config.handler(ref)
      } catch (e) {
        throw e
      }

    }
  }

}