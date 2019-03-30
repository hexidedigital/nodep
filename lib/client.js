const fs = require('fs')
const path = require('path')
const osPath = path.posix
const Connection = require('./connection')

const sftpUploader = require('./sftp/uploader')

// let sftpClient = require('ssh2-sftp-client');
// let sftp = new sftpClient();

module.exports = class Client extends Connection {

  constructor (options = {}, logger) {
    super(options.connectOptions)

    this.logger = logger != null ? logger : console

    this.stage = options.stage || 'development'
    this.name = options.name || ~~(Math.random() * 65535)

    this.releasePath = options.releasePath || '.'
    //  working directory can be changed during task execution
    this.workingDir  = this.releasePath

    this._setState('initialized')
  }

  isReady () {
    return this._state === 'ready' && (this._socket != null)
  }

  connect () {
    //@todo use proxy
    super.connect()
  }

  getStage () {
    return this.stage
  }

  _getCommand (command) {
    return 'cd ' + this.workingDir + ' && ' + command
  }

  _getRemoteDirectoryPath (task) {
    return task.workDir != null ? task.workDir : this.releasePath
  }

  run (command, config) {

    config = config || {env: {}, pty: false, x11: false}

    return new Promise((resolve, reject) => {
      this._socket.exec(
        this._getCommand(command),
        {
          env: config.env || {},
          pty: config.pty || false,
          x11: config.x11 || false
        },
        (err, stream) => {
          let writtenTitle = false, responseData = []
          if (err) {
            console.log(err)
            return reject(err)
          }
          stream.stdout.setEncoding('utf8')
          stream.stderr.setEncoding('utf8')

          stream.stdout.on('data', (data) => {
            if (!writtenTitle) {
              this.logger.log('\u001b[32m• ' + this.name + '\u001b[39m')
              writtenTitle = true
            }
            responseData.push(data.trim())
            return this.logger.log('\u001b[90m' + (data.trim()) + '\u001b[39m')
          })

          stream.stderr.on('data', (data) => {
            if (!writtenTitle) {
              this.logger.log('\u001b[31m• ' + this.name + '\u001b[39m')
              writtenTitle = true
            }
            return this.logger.log('\u001b[90m' + (data.trim()) + '\u001b[39m')
          })

          return stream.on('close', () => {resolve(responseData)})
        }
      )
    })

  }

  exec (task, next) {

    if (!(this._state === 'ready' && (this._socket != null))) {
      return next()
    }

    if (task.command == null) {
      return next()
    }

    this.workingDir = this._getRemoteDirectoryPath(task)

    if (typeof task.command === 'function') {
      return task.command(this).then(next).catch(next)
    }

    return this.run(task.command, task.getExecConfig())
      .then(next).catch(next)
  };

  execSftp (task, next) {
    let remotePath = this._getRemoteDirectoryPath(task)
    let options = {
      source: '',
      localPath: task.command[1],
      remotePath: remotePath
    }

    this._sftpConnect(this._socket).upload(options, next)
  }

  _sftpConnect (client) {
    return new sftpUploader(client)
  }
}