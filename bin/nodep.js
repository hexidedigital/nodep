#!/usr/bin/env node

// prepare variables
const fs = require('fs')
const path = require('path')

// detect console parameters
const recipe = (process.argv[2] || 'deploy')
const stage = (process.argv[3] || 'production')


const pwd = path.resolve('.')


if (recipe === 'setup') {
  // mkdir deploy
  // copy default recipe
  // copy default tasks
}




