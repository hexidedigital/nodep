module.exports = class Recipe {

  constructor (content, logger) {
    this.logger = logger != null ? logger : console

    this.name = content.name || 'unknown'
    this.tasks = []

    this._loadTasks(content.tasks)

  }

  _loadTasks (tasks) {

    let task

    if (tasks.length > 0) {
      tasks.forEach((row) => {

        if (typeof row  === 'string') {
          task = require('./tasks/' + row)
        } else {
          task = row;
        }
        this.tasks.push(task)
      })
    }

  };

  getTasks () {
    return this.tasks
  };
}