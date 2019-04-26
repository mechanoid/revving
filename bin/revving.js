#!/usr/bin/env node

const path = require('path')
const args = require('args')

const revving = require(path.join('..', 'index.js'))

args.option(
  'input-directory',
  'asset directory which contained files should be revved',
  undefined,
  requiredCheck('--input-directory / -i')
)

args.option(
  'output-directory',
  'target directory for the revved files',
  undefined,
  requiredCheck('--output-directory / -o')
)

args.option(
  'copy-original-files',
  'also copy the not hashed files to the target dir',
  true
)

args.option(
  'mode',
  `mode can be "development", "production" or "auto".

In "development" mode, the manifest reflects the orginal file names. This is helpful in that
the manifest.json file still needs only to be required once. And changes
of the asset contents do not need to result in a re-read of the manifest.json.

The "auto" value sets the property value to what is set as NODE_ENV environment variable.
When NODE_ENV is set to "production" it is production, otherwise it is "development"
`,
  'production',
  val => {
    if (val === 'auto') {
      return process.env.NODE_ENV === 'production'
        ? 'production'
        : 'development'
    }

    return val
  }
)

const flags = args.parse(process.argv)

const inputDir = flags.inputDirectory
const outputDir = flags.outputDirectory
const options = { copyOriginalFiles: flags.copyOriginalFiles, mode: flags.mode }

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
