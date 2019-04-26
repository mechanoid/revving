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

args.option(
  'copy-original-files',
  'also copy the not hashed files to the target dir',
  true
)

const flags = args.parse(process.argv)

const inputDir = flags.inputDirectory
const outputDir = flags.outputDirectory
const options = { copyOriginalFiles: flags.copyOriginalFiles }

console.log(`start revving files for "${inputDir}":`)

revving
  .revFiles(inputDir, outputDir, options)
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
