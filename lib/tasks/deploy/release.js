const path = require('path')
const fs = require('fs')

module.exports = async (client) => {
    // rm old release directory
    await client.run("rm -rf ${deploy_path}/release");

    // create release directory
    await client.run("cd ${deploy_path} && if [ ! -d release ]; then mkdir release; fi");


    // upload
    const localPath = client.getVariable('source_directory')

    if (!fs.existsSync(localPath)) {
        throw 'Source directory does not exist: ' + localPath
    }

    const remotePath = client.seedVariables('${deploy_path}/release')

    await client.upload(localPath, remotePath)

    // read list of releases

    let list = [];
    let current_release = 1
    let next_release = current_release + 1

    // If there is no releases return empty list.
    const result = await client.test('[ -d ${deploy_path}/releases ] && [ "$(ls -A ${deploy_path}/releases)" ]')

    if (result) {

        list = await client.run('cd  ${deploy_path}/releases && ls -t -1 -d */')
        list = list[0].split('\n').map((row) => {
            return parseInt(row)
        })

        current_release = Math.max(...list)
        next_release = current_release + 1
    }

    client.setVariable('release_path', 'releases/' + next_release)

    // create next release
    await client.run('cd  ${deploy_path}/releases && mkdir ' + next_release)

    // move code from release folder to releases/{id}

    await client.run('mv ${deploy_path}/release/* ${deploy_path}/releases/' + next_release)
}