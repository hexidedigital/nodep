module.exports = (dep) => {

  dep = require('./common')(dep)

  dep.task('default', [
    'deploy.prepare',
    'deploy.lock',
    'deploy.release',
    'deploy.symlink',
    'deploy.cleanup',
    'deploy.unlock',
    'success',
  ]);

  return dep
}