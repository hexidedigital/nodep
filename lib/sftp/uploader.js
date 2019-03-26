const fs = require('fs')
const glob = require('glob')
const {join, extname, parse} = require('path')

function error (err) {
  if (err) {
    console.log('error: ', err)
    throw err
  }
}

module.exports = class SftpUploader {

  constructor (conn, logger) {
    this.logger = logger != null ? logger : console

    this.conn = conn
    this.sftp = undefined
  }

  upload (options, callback) {
    let {source, localPath} = options,
      {file, dir} = this._resolve(source)

    this._sftp((sftp) => {
      glob(localPath + '/**/' + (dir === '' ? '**' : dir) + '/**', (err, paths) => {
        if (err) {
          console.log('error:', err)
          throw err
        }

        let {dirAttr, fileObj} = this._stat(paths, file, options)

        this._makeDirs(dirAttr, options, 'local')
          .then(() => {
            this._upload(fileObj, sftp, callback)
          })
          .catch((e) => {
            console.log(e)
          })
      })
    })
  }

  download (options, callback) {

    this._remoteStat(options, (oPath) => {
      let {dirAttr, fileAttr} = oPath

      this._makeDirs(dirAttr, options, 'remote').then(() => {
        this._sftp((sftp) => {
          this._download(fileAttr, options, sftp, callback)
        })
      })
    })
  };

  // Starts an SFTP session.
  _sftp (callback) {
    this.conn.sftp((err, sftp) => {
      error(err)

      this.sftp = sftp
      callback && callback(sftp)
    })
  };

  // Starts an interactive shell session on the server.
  _shell (options, callback) {
    let {source, remotePath} = options
    // Find the source if specified the source.
    let cmd = 'find ' + remotePath + (source ? '/' + source : '') + '\r\nexit\r\n'

    this.conn.shell((err, stream) => {
      error(err)

      let buf = ''
      stream.on('data', (data) => {
        buf = buf + data
      }).on('close', () => {
        callback && callback(buf)
      }).stderr.on('data', (data) => {
        console.log('stderr: ' + data)
      })
      stream.end(cmd)
    })
  };

  // Distinguish files and directories according to source.
  _resolve (source) {
    let paths = {
      dir: '',
      file: ''
    }

    if (!source) return paths

    let {dir, base, ext} = parse(source)

    // source: directory, ex. static or static/test
    if (ext === '') {
      paths.file = ''
      paths.dir = source
    } else if (dir) {
      // source: directory + file, ex. static/test.js
      paths.file = base
      paths.dir = dir
    } else {
      // source: file, ex. test.js
      paths.file = source
      paths.dir = ''
    }

    return paths
  };

  // Dtatistics of all local directories and files that need to be manipulated.
  _stat (paths, fileName, options) {
    let {remotePath, localPath} = options,
      oPath = {
        dirAttr: [],
        fileObj: {}
      }

    paths.forEach(function (file) {
      let dictPath = join(remotePath, file.replace(localPath, ''))

      if (extname(file) === '') {
        oPath.dirAttr.push(dictPath)
      } else {
        // ingore hash
        const thisFile = parse(file),
          thisFileName = thisFile.base.split('.')[0] + thisFile.ext

        // manipulate files which named fileName if set fileName
        if (fileName && thisFileName !== fileName) return true

        oPath.fileObj[file] = dictPath
      }
    })

    return oPath
  };

  // Dtatistics of all remote directories and files that need to be manipulated.
  _remoteStat (options, callback) {
    let {remotePath, source} = options

    this._shell(options, (data) => {
        let arr = data.split('\r\n'),
          oPath = {
            dirAttr: [],
            fileAttr: []
          }

        arr.forEach(function (dir) {
          if (dir.indexOf(remotePath) == 0) {
            extname(dir) === '' ? oPath.dirAttr.push(dir) : oPath.fileAttr.push(dir)
          }
        })

        if (oPath.dirAttr.length === 0 && oPath.fileAttr.length === 0) {
          return console.log('Find no such directory at ', remotePath + (source && '/') + source, ' please check at remote!')
        }

        callback && callback(oPath)
      }
    )
  };

  // Create directories
  _makeDirs (dirs, options, type) {
    let {remotePath, localPath, source} = options

    return new Promise((resolve, reject) => {

      // Create local directories,execute when downloading from remote.
      if (type === 'remote') {
        // Create dirs according to the source if specified the source.
        if (source) {
          let {ext} = parse(source),
            paths = source.split('/'),
            localDir = ''

          // add localPath
          paths.unshift(localPath)

          // delete file if source has file. (ex. static/index.html)
          ext !== '' && paths.pop()

          paths.map((path) => {
            localDir += path === localPath ? localPath : '/' + path
            !fs.existsSync(localDir) &&
            fs.mkdirSync(localDir)
          })
        }

        // Create others dirs.
        dirs.map((dir) => {
          var localDir = dir.replace(remotePath, localPath)

          !fs.existsSync(localDir) &&
          fs.mkdirSync(localDir)
        })
      }

      // Create local directories,execute when uploading from local.
      if (type === 'local') {
        let that = this
        dirs.map((dir) => {

          let pathAttr = dir.split('/'),
            tempDir = '',
            localDirs = []

          pathAttr.shift()
          pathAttr.map((path) => {
            tempDir += '/' + path
            localDirs.push(tempDir)
          })

          localDirs && localDirs.map((file) => {
            let stat = fs.lstatSync(dir.replace(remotePath, localPath))

            that.sftp.exists(file, (isExist) => {
              if (isExist) return
              // create directory if stat is directory
              stat.isDirectory() &&
              that.sftp.mkdir(file, function (err) {
                if (err) return reject(err)
              })
            })
          })
        })
      }

      return resolve()
    })
  };

  _upload (files, sftp, callback) {
    let len = 0

    for (let i in files) {
      len++
      sftp.fastPut(i, files[i], (err) => {
        if (err) {
          // try again if uploaded fail.
          sftp.fastPut(i, files[i], (err) => {
            if (err) return console.log('error:', err)

            console.log('Upload: ', i, ' --> ', files[i])
            if (--len === 0) {
              callback && callback()
            }
          })
        } else {
          console.log('Upload: ', i, ' --> ', files[i])
          if (--len === 0) {
            callback && callback()
          }
        }
      })
    }
  };

  _download (files, options, sftp, callback) {
    let {remotePath, localPath} = options,
      len = 0

    files.map((file) => {
      len++
      var tmpPath = file.replace(remotePath, localPath)
      sftp.fastGet(file, tmpPath, (err, result) => {
        if (err) {
          sftp.fastGet(file, tmpPath, (err, result) => {
            error(err)

            console.log('Download: ', tmpPathfile, ' <-- ', file)
            if (--len === 0) {
              callback && callback()
            }
          })
        } else {
          console.log('Download: ', tmpPath, ' <-- ', file)
          if (--len === 0) {
            callback && callback()
          }
        }
      })
    })
  };
}

