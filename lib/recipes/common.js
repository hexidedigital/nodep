const path = require('path')

module.exports = (dep) => {

  dep.set('keep_releases', 5);
  dep.set('source_directory', path.resolve('./build'));

  dep.task('success', function(){
    console.log('Command success');
  });

  dep.task('default', [
    'success'
  ]);

  return dep
}