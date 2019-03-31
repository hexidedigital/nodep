module.exports = async (client) => {
  await client.run('cd ${deploy_path} && pwd')
}