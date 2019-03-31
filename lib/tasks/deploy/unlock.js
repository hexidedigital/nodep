module.exports = async (client) => {
    client.run("rm -f ${deploy_path}/.dep/deploy.lock");//always success
}