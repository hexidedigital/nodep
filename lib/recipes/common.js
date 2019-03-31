module.exports = (dep) => {

  dep.set('keep_releases', 5);

  dep.task('success', function(){
    console.log('Command success');
  });

  dep.task('default', [
    'success'
  ]);

  return dep
}