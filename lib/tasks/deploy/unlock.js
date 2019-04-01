module.exports = async (client) => {
    await client.run("rm -f ${deploy_path}/.dep/deploy.lock");//always success
}