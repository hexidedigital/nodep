module.exports = (dep) => {

  dep = require('./common')(dep)

  dep.task('default', [
    'deploy.prepare',
    'deploy.lock',
    'success'
  ]);

  return dep
}