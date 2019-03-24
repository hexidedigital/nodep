// prepare variables
const fs = require('fs')
const path = require('path')
const Dep = require('../lib')
const Recipe = require('../lib/recipe')

// detect console parameters
const recipe_name = (process.argv[2] || 'deploy')
const stage = (process.argv[3] || 'production')

// load recipe from local directory or from lib
let recipe_content;
try {
  recipe_content = require('./recipes/' + recipe_name)
} catch (e) {
  recipe_content = require('../lib/recipes/' + recipe_name)
}


// prepare recipe
const rec = new Recipe(recipe_content);
console.log('LIST!!', rec.getTasks());



const servers = [
  {
    'useProxy': false,
    'name': 'smart-money-3',
    'stage': 'dev-3',
    'releasePath': '/home/smart-money-3/web/smart-money-3.nwdev.net/public_html',
    'connectOptions': {
      'host': '46.148.26.160',
      'port': 22,
      'username': 'smart-money-3',
      'privateKey': fs.readFileSync(path.resolve('.ssh_dev3/id_rsa'))
      // "password": "123456"
    }
  }
]

const dep = new Dep(stage);
dep.initServers(servers)
dep.prepare(rec)

// const dep = new Dep(options);

dep.on('ready', dep.start);
dep.on('done', () => {console.log('tasks completed');});
