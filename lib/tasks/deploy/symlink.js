module.exports = async (client) => {

  await client.run('cd ${deploy_path} && ln -nfs ${release_path} current')

}