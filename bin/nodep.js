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
    },
    default: {
      stage: 'production'
    },
  }
)

// empty recipe - just show help
if (argv._.length === 0 && !argv.version) {
  argv.help = argv.h = true
}

// show help
if (argv.help) {
  console.log('Usage: nodep [recipe] [arguments]')
  console.log('       nodep init --stage=dev')
  console.log('')
  console.log('Options:')
  console.log('   -v, --version                   print current version')
  console.log('   -h, --help                      print this help message')
  console.log('   -s, --stage                     server stage')
  console.log('')
  console.log('Default recipes:')
  console.log('   setup                           generate initial deployer directory')
  console.log('   init                            prepare directory structure on all servers')
  console.log('   echo                            run simple echo command to ping servers')

  process.exit()
}
// show version
if (argv.version) {
  console.log('v%s', version)
  process.exit()
}

// there is some recipe -
argv.recipe = argv._[0]
// console.dir(argv);

if (argv.recipe === 'setup') {
  // check if directory exists
  if (fs.existsSync(pwd + '/deploy')) {
    console.error('Directory %s already exists!', pwd + '/deploy')
    process.exit(1)
  }

  // mkdir deploy
  fs.mkdirSync(pwd + '/deploy')
  // copy scaffolds
  copydir.sync(project_root + '/scaffold', pwd + '/deploy')

  console.info('Setup success!')

} else {
  // try to find local or external recipe

  // detect deploy directory
  if (!fs.existsSync(pwd + '/deploy')) {
    console.error('Directory %s does not exists!', pwd + '/deploy')
    process.exit(1)
  }

  // detect recipe
  if (!fs.existsSync(pwd + '/deploy/' + argv.recipe + '.js')) {
    console.error('Cannot read recipe %s!', argv.recipe)
    process.exit(1)
  }


  let dep = new Dep(argv.stage, pwd, project_root);
  dep = require(pwd + '/deploy/' + argv.recipe + '.js')(dep)
  dep.run('default')


}




