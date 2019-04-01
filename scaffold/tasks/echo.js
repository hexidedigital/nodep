module.exports = async (client) => {

  let result = await client.run('echo "Hello from local task!"')
  // console.log('ECHO', result)
}