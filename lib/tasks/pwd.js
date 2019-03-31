module.exports = async (client) => {
  await client.run('cd ${release_path} && pwd')
}