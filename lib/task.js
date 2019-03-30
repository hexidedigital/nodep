module.exports = class Task {

  constructor (options = {}, logger) {
    this.logger = logger != null ? logger : console

    this.command = options.command

    this.description = options.description || ~~(Math.random() * 65535)
    this.workDir = options.workDir
    this.priority = options.priority || 0
    this.stages = options.stages || 'all'
    this.env = options.env || {}
    this.pty = options.pty || false
    this.x11 = options.x11 || false
  }

  canExec (stage) {
    return this.stages === 'all' || (this.stages.indexOf && (this.stages.indexOf(stage) > -1 || this.stages.indexOf('all') > -1))
  };

  getExecConfig(){
    return {
      env: this.env,
      pty: this.pty,
      x11: this.x11
    }
  }

  exec (clients, nextTask) {
    let nextServer;

    if (clients == null) {
      clients = []
    }
    let serverNames = Object.keys(clients).filter((name) => {
      return this.canExec(clients[name].getStage())
    })

    // nothing to execute
    if (serverNames.length < 1) {
      return nextTask()
    }

    this.logger.log('╭─ Executing task \u001b[32m' + this.description + '\u001b[39m')
    this.logger.log('╰─➤ on [' + (serverNames.join(', ')) + ']')

    nextServer = () => {
        let _name, ref
        if (serverNames.length < 1) {
          return nextTask()
        }
        _name = serverNames.shift()
        if (!((ref = clients[_name]) != null ? ref.isReady() : void 0)) {
          return
        }
        return clients[_name].exec(this, nextServer)
    }
    return nextServer()
  }
}