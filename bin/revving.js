#!/usr/bin/env node

const path = require('path')
const args = require('args')

const revving = require(path.join('..', 'index.js'))

args.option(
  'input-directory',
  'asset directory which contained files should be revved',
  '',
  requiredCheck('--input-directory / -i')
)

args.option(
  'output-directory',
  'target directory for the revved files',
  '',
  requiredCheck('--output-directory / -o')
)

const flags = args.parse(process.argv)

const inputDir = flags.inputDirectory
const outputDir = flags.outputDirectory

console.log(`start revving files for "${inputDir}":`)

revving(inputDir, outputDir)
  .then(manifest => {
    console.log(manifest)
  })
  .catch(e => {
    console.error(e)
    process.exit(1)
  })

function requiredCheck (option) {
  return val => {
    if (!val) {
      throw new Error(`${option} is missing`)
    }
    return val
  }
}
