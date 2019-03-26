const fs = require('fs')
const path = require('path');
const osPath = path.posix;
const Connection = require('./connection')

const sftpUploader = require('./sftp/uploader');

// let sftpClient = require('ssh2-sftp-client');
// let sftp = new sftpClient();

module.exports = class Client extends Connection {

  constructor (options = {}, logger) {
    super(options.connectOptions)

    this.logger = logger != null ? logger : console

    this.name = options.name || ~~(Math.random() * 65535)
    this.releasePath = options.releasePath || '.'
    this.stage = options.stage || 'development'

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

  getCommand (task) {
    return 'cd ' + this._getRemoteDirectoryPath(task) + ' && ' + task.command[0]
  }

  _getRemoteDirectoryPath (task) {
    return task.workDir != null ? task.workDir : this.releasePath
  }

  exec (task, next) {

    if (!(this._state === 'ready' && (this._socket != null))) {
      return next()
    }

    if (task.command == null || task.command.length < 1) {
      return next()
    }

    // detect core command

    if (task.command[0] === 'core.copy') {
      return this.execSftp(task, next)
    }

    return this._socket.exec(
      this.getCommand(task),
      {
        env: task.options,
        pty: task.pty,
        x11: task.x11
      },
      (err, stream) => {
        let writtenTitle
        if (err) {
          return console.log(err && next())
        }
        stream.stdout.setEncoding('utf8')
        stream.stderr.setEncoding('utf8')
        writtenTitle = false

        stream.stdout.on('data', (data) => {
          if (!writtenTitle) {
            this.logger.log('\u001b[32m• ' + this.name + '\u001b[39m')
            writtenTitle = true
          }
          return this.logger.log('\u001b[90m' + (data.trim()) + '\u001b[39m')
        })

        stream.stderr.on('data', (data) => {
          if (!writtenTitle) {
            this.logger.log('\u001b[31m• ' + this.name + '\u001b[39m')
            writtenTitle = true
          }
          return this.logger.log('\u001b[90m' + (data.trim()) + '\u001b[39m')
        })

        return stream.on('close', next)
      }
    )
  };

  execSftp (task, next) {
    let remotePath = this._getRemoteDirectoryPath(task)
    let options = {
      source: '',
      localPath: task.command[1],
      remotePath: remotePath
    };

    this._sftpConnect(this._socket).upload(options, next);
  }

  _sftpConnect (client) {
    return new sftpUploader(client);
  }
}