module.exports = async (client) => {

  const locked = client.test("[ -f ${deploy_path}/.dep/deploy.lock ]");

  if (locked) {
    throw 'Deploy locked. Execute "nodep deploy.unlock" to unlock.'
  }

  client.run("touch ${deploy_path}/.dep/deploy.lock");
}