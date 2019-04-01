module.exports = async (client) => {

  const locked = await client.test("[ -f ${deploy_path}/.dep/deploy.lock ]");

  if (locked === true) {
    throw 'Deploy locked. Execute "nodep deploy.unlock" to unlock.'
  }

  await client.run("touch ${deploy_path}/.dep/deploy.lock");

}