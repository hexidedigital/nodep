module.exports = (dep) => {

  dep = require('./common')(dep)

  dep.task('default', [
    'echo',
    'pwd',
    'lsla',
    'success'
  ]);

  return dep
}