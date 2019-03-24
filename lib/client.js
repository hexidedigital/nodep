const Connection = require('./connection')

module.exports = class Client extends Connection {

  constructor (options = {}, logger) {
    super(options.connectOptions)

    this.logger = logger != null ? logger : console;

    this.name = options.name || ~~(Math.random() * 65535);
    this.releasePath = options.releasePath || '.';
    this.stage = options.stage || 'development';

    this._setState('initialized');
  }

  isReady () {
    return this._state === 'ready' && (this._socket != null)
  }

  connect () {
   //@todo use proxy
    super.connect();
  }

  getStage() {
    return this.stage;
  }


  getCommand(task) {
    if (task.workDir != null) {
      return "cd " + task.workDir + " && " + task.command;
    } else {
      return "cd " + this.releasePath + " && " + task.command;
    }
  }

  exec(task, next) {

    if (!(this._state === 'ready' && (this._socket != null))) {
      return next();
    }

    if (task.command == null) {
      return next();
    }

    return this._socket.exec(
      this.getCommand(task),
      {
        env: task.options,
        pty: task.pty,
        x11: task.x11
      },
      (err, stream) => {
        let writtenTitle;
        if (err) {
          return console.log(err && next());
        }
        stream.stdout.setEncoding('utf8');
        stream.stderr.setEncoding('utf8');
        writtenTitle = false;

        stream.stdout.on('data', (data) => {
          if (!writtenTitle) {
            this.logger.log("\u001b[32m• " + this.name + "\u001b[39m");
            writtenTitle = true;
          }
          return this.logger.log("\u001b[90m" + (data.trim()) + "\u001b[39m");
        });

        stream.stderr.on('data', (data) => {
          if (!writtenTitle) {
            this.logger.log("\u001b[31m• " + this.name + "\u001b[39m");
            writtenTitle = true;
          }
          return this.logger.log("\u001b[90m" + (data.trim()) + "\u001b[39m");
        });

        return stream.on('close', next);
      }
      )
  };

}