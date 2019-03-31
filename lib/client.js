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

    this.variables = options.variables || {}
    this.variables.deploy_path = options.deploy_path || '.'

    this._setState('initialized')
  }

  isReady () {
    return this._state === 'ready' && (this._socket != null)
  }

  connect () {
    super.connect()
  }

  _getCommand (command) {

    const keys = Object.keys(this.variables);
    const func = Function(...keys, "return `" + command + "`;");

    return func(...keys.map(k => this.variables[k]));
  }

  getVariable (name) {
    return this.variables[name]
  }


  run (command, config) {
    console.log('RUN', command)
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

  async test(command, config)
  {
    const res = await this.run('if ' + command + '; then echo "true"; fi', config);
    return res[0] === 'true'
  }


  execSftp (task, next) {
    //let remotePath = this._getRemoteDirectoryPath(task)
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