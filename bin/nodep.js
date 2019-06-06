#!/usr/bin/env node

// prepare variables
const fs = require('fs')
const path = require('path')
const copydir = require('copy-dir')

const pwd = path.resolve('.')
const project_root = path.resolve(__dirname + '/../')
const version = require(project_root + '/package.json').version
const Dep = require(project_root + '/lib/deployer')

var argv = require('minimist')(
  process.argv.slice(2),
  {
    alias: {
      h: 'help',
      v: 'version',
      s: 'stage',
      c: 'config',
      b: 'branch',
    },
    default: {
      stage: 'production',
      config: 'config',
      branch: 'master'
    },
  }
)

// show help
if (argv.help) {
  console.log('Usage: nodep [task] [arguments]')
  console.log('       nodep init --stage=dev')
  console.log('')
  console.log('Options:')
  console.log('   -v, --version                   print current version')
  console.log('   -h, --help                      print this help message')
  console.log('   -s, --stage                     server stage')
  console.log('   -c, --config                    config file')
  console.log('   -b, --branch                    git branch name')
  console.log('')
  console.log('Default recipes:')
  console.log('   init                           generate initial deployer directory')
  console.log('   echo                            run simple echo command to ping servers')

  process.exit()
}
// show version
if (argv.version) {
  console.log('v%s', version)
  process.exit()
}

// there is some recipe -
argv.task = argv._[0] || 'default'
// console.dir(argv);

if (argv.task === 'init') {
  // check if directory exists
  if (fs.existsSync(pwd + '/deploy')) {
    console.error('Directory %s already exists!', pwd + '/deploy')
    process.exit(1)
  }

  // mkdir deploy
  fs.mkdirSync(pwd + '/deploy')

  // copy scaffolds
  copydir.sync(project_root + '/scaffold', pwd + '/deploy')

  console.info('Init success!')

} else {
  // try to find local or external recipe

  // detect deploy directory
  if (!fs.existsSync(pwd + '/deploy')) {
    console.error('Directory %s does not exists!', pwd + '/deploy')
    process.exit(1)
  }

  // detect config
  if (!fs.existsSync(pwd + '/deploy/' + argv.config + '.js')) {
    console.error('Cannot read config %s!', argv.config)
    process.exit(1)
  }


  let dep = new Dep(argv.stage, pwd, project_root);

  dep.set('git_branch', argv.branch);

  dep = require(pwd + '/deploy/' + argv.config + '.js')(dep)
  dep.run(argv.task)

}




