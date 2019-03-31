module.exports = async (client) => {
  await client.run('if [ ! -d ${deploy_path} ]; then mkdir -p ${deploy_path}; fi')

  // Check for existing /current directory (not symlink)
  const result = await client.test('[ ! -L ${deploy_path}/current ] && [ -d ${deploy_path}/current ]');
  if (result) {
    throw 'There already is a directory (not symlink) named "current" in ' + client.getVariable('deploy_path') + '. Remove this directory so it can be replaced with a symlink for atomic deployments.';
  }

  // Create metadata .dep dir.
  await client.run("cd ${deploy_path} && if [ ! -d .dep ]; then mkdir .dep; fi");

  // Create releases dir.
  await client.run("cd ${deploy_path} && if [ ! -d releases ]; then mkdir releases; fi");

  // Create shared dir.
  // await run("cd ${deploy_path} && if [ ! -d shared ]; then mkdir shared; fi");

}