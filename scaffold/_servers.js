const fs = require('fs')
const path = require('path')

module.exports = [
  {
    'useProxy': false,
    'name': 'servername',
    'stage': 'dev',
    'releasePath': '/var/www',
    'connectOptions': {
      'host': '127.0.0.1',
      'port': 22,
      'username': 'root',
      'privateKey': fs.readFileSync(path.resolve('.ssh/id_rsa'))
      // "password": "123456"
    }
  }
];