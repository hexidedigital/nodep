const fs = require('fs')

module.exports = class Recipe {

  constructor (content, pwd, project_root, logger) {
    this.pwd = pwd
    this.project_root = project_root
    this.logger = logger != null ? logger : console

    this.name = content.name || 'unknown'
    this.tasks = []

    this._loadTasks(content.tasks)

  }

  _loadTasks (tasks) {

    let task

    if (tasks.length > 0) {
      tasks.forEach((row) => {

        if (typeof row === 'string') {

          // detect task location
          if (fs.existsSync(this.pwd + '/deploy/tasks/' + row + '.js')) {
            task = require(this.pwd + '/deploy/tasks/' + row + '.js')
          } else if (fs.existsSync(this.project_root + '/lib/tasks/' + row + '.js')) {
            task = require(this.project_root + '/lib/tasks/' + row + '.js')
          } else {
            console.error('Cannot read task %s!', row)
            process.exit(1)
          }
        } else {
          task = row
        }
        this.tasks.push(task)
      })
    }

  };

  getTasks () {
    return this.tasks
  };

}