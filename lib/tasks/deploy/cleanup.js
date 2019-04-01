module.exports = async (client) => {

  // remove release directory
  await client.run("rm -rf ${deploy_path}/release")

  // remove old releases

  let list = [];
  // If there is no releases return empty list.
  const result = await client.test('[ -d ${deploy_path}/releases ] && [ "$(ls -A ${deploy_path}/releases)" ]')

  if (result) {

    list = await client.run('cd  ${deploy_path}/releases && ls -t -1 -d */')
    list = list[0].split('\n').map((row) => {
      return parseInt(row)
    })

    const keep_releases = client.getVariable('keep_releases')

    list = list.slice(keep_releases)

    for (const release of list) {
      await client.run("rm -rf ${deploy_path}/releases/" + release)
    }

  }

}