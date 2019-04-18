# Node Deployer

This is a lightweight deployment tool for frontend projects based on ssh2 protocol.

## Features

* Execute linux command on remote server
* Rotate releases folders 
* Upload files from dist directory to release folder
* Default recipes for simple deployment

## Inspired by

* [charleslxh/node-dep](https://github.com/charleslxh/node-dep)
* [PHP Deployer](https://deployer.org/)


## How to install

```bash
$ npm i @hexide-digital/node-deployer --save-dev
```

## Usage
`nodep [task] [arguments]`

`nodep init --stage=dev`
    
### Options
* **-v, --version** - print current version
* **-h, --help** - print this help message
* **-s, --stage** - server stage
* **-c, --config** - config file

### Default tasks
* **init** - generate initial deployer directory
* **echo** - run simple echo command to ping servers


## Configurations

### Recipes
Recipe is a set of the commands and default settings.
Recipe 'Deploy' extends recipe 'Common' and contains a list of commands:
```js
dep.task('default', [
    'deploy.prepare',
    'deploy.lock',
    'deploy.release',
    'deploy.symlink',
    'deploy.cleanup',
    'deploy.unlock',
    'success',
  ]);
```

### Tasks

Task is the special linux command to excute.
Default package task can be overwritten with local file with the same name.
Each task can be a closure function (with one argument - client), object with other tasks or string with file name.

### Proxy

This package currently does not support proxy

### Server

- **stage**: the server stage.
- **deploy_path**: your application release path.
- **connectOptions**: see [node-ssh2 client connect configuration](https://github.com/mscdex/ssh2#client-methods).

## Events

- **ready**: when all clents connected, this event will be fire.
- **done**: All task completed.

## Methods

- **servers(< object >servers)**: add remote servers list.
- **task(< string >name, < object >closure, < object >options)**: add new task
- **set(< string >name,< object >options)**: set variable
- **get(< string >name)**: get variable
- **run(< string >task)**: run a remote server.

## Variables

You can use default or custom variables in commands

```js
dep.set('source_directory', path.resolve('./build'))

...

client.test('[ -d ${deploy_path}/releases ] && [ "$(ls -A ${deploy_path}/releases)" ]')
```

## Examples

```js
const fs = require('fs')
const path = require('path')

module.exports = (dep) => {

  dep = require('@hexide-digital/node-deployer/lib/recipes/deploy')(dep)

  dep.servers(
    [
      {
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
    ]
  )

  return dep
}
```

## Todo
This package is still in beta. Please, send your requests. I'll apply them asap.
First thing needed to be done is files upload.
Probably best choice would be archive all files in dist directory into single file, upload it to remote server and unzip it.
For now each file uploads separately one by one. That is OK for small project but may be headache.
