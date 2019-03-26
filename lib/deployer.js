const EventEmitter = require('events').EventEmitter
const Client = require('./client');
const Task = require('./task');

module.exports = class Deployer extends EventEmitter {
  constructor (stage, logger) {
    super()

    this.logger = logger != null ? logger : console;

    this.stage = stage;
    this.clients = {};
    this.tasks = [];

    /*if (options.servers == null) {
      options.servers = [];
    }

    if (options.tasks == null) {
      options.tasks = [];
    }*/

    // this.readyThreshold = true;//options.readyThreshold || options.servers.length || 1;

    /*options.servers.forEach((options) => {
      this.addServer(options);
    });

    options.tasks.forEach((options) => {
      this.addTask(options);
    });*/

    this.bindEvents();
  }

  bindEvents() {
    this.once('done', () => {
      let keys = Object.keys(this.clients);
      keys.forEach((c) => {
        this.clients[c].disconnect();
      });
    })
  }

  initServers(servers) {

    let list = servers.filter((server) => {
      return server.stage === this.stage
    });

    this.readyThreshold = list.length

    list.forEach((options) => {
        this.addServer(options);
    })
  }

  prepare(recipe) {
    recipe.getTasks().forEach((options) => {
      this.addTask(options);
    });
  }

  setLogger(logger) {
    this.logger = logger;
  }

  ready() {
    if (Object.keys(this.clients).length >= this.readyThreshold) {
      return this.emit('ready');
    }
  }

  addServer (options, callback) {
    if (options == null) {
      return
    }

    let client = new Client(options, this.logger)

    client.once('ready', () => {
      this.clients[options.name] = client
      this.logger.log('\u001b[32m' + options.name + '\u001b[39m connected')
      this.ready()
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

  removeServer(name, callback) {
    const client = this.clients[name];
    if (client === null) {
      return
    }

    client.once('closed', () => {
      this.clients[name] = null;
      delete this.clients[name];
      return typeof callback === "function" ? callback() : void 0;
    });

    setTimeout(() => {
      this.clients[name] = null;
      delete this.clients[name];
      return typeof callback === "function" ? callback() : void 0;
    }, 3 * 1000);

    return client.close();
  }

  addTask(options) {
    if (options == null) {
      return;
    }

    return this.tasks.push(new Task(options, this.logger));
  }
  removeTask(name) {
    let index;
    index = this.tasks.findIndex((task) => {
      return (task != null) && task.name === name;
    });
    if (index > -1) {
      return this.tasks.splice(index, 1);
    }
  }

  sort(callback) {
    return this.tasks.sort(callback || function(pre, next) {
      if (pre.priority == null) {
        pre.priority = 0;
      }
      if (next.priority == null) {
        next.priority = 0;
      }
      return next.priority - pre.priority;
    });
  }

  start() {
    let tasks = this.sort();
    let next = () => {
        let _task;
        if (tasks.length < 1) {
          return this.emit('done');
        }
        _task = tasks.shift();
        if (_task == null) {
          return;
        }
        return _task.exec(this.clients, next);
      };
    return next();
  };

}