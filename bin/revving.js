#!/usr/bin/env node

const path = require('path')
const args = require('args')

const revving = require(path.join('..', 'index.js'))
const { logger, transports } = require(path.join('..', 'logger.js'))

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
  false
)

args.option(
  'prefix-path',
  'path that prefixes all file references in the manifest.json'
)

args.option('verbose', 'provided more output')

args.option(
  'mode',
  `mode can be "development", "production" or "auto".
      In "production" mode only revved files are copied, if not accompanied by --copy-original-files.
      The revved files are referenced in the manifest file then.

      In "development" mode, the manifest reflects the orginal file names. This is helpful in that
      the manifest.json file still needs only to be required once. And changes
      of the asset contents do not need to result in a re-read of the manifest.json.

      The "auto" value sets the property value to what is set as NODE_ENV environment variable.
      When NODE_ENV is set to "production" it is production, otherwise it is "development".

      NOTE: if mode is equal to "development" all original files will always be copied, disregards
      to --copy-original-files or --dont-copy-original-files`,
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

args
  .example(
    'revving -i ./my-asset-folder',
    'selecting the folder which should be provided with revved versions'
  )
  .example(
    'revving -o ./my-target-folder',
    'selecting the folder where the revved assets should be copied to'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder',
    'defaults to "production" mode. Copies original and revved files to ./my-target-folder'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder -m production',
    'copying only revved files to ./my-target-folder'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder -m production',
    'copying only revved files to ./my-target-folder'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder -m production -c',
    'copying original and revved files to ./my-target-folder'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder -m development',
    'copying original and revved files to ./my-target-folder. Manifest references the original file names'
  )
  .example(
    'NODE_ENV=production revving -i ./my-asset-folder -o ./my-target-folder -m auto',
    'same as -m production'
  )
  .example(
    'NODE_ENV=development revving -i ./my-asset-folder -o ./my-target-folder -m auto',
    'same as -m development'
  )
  .example(
    'revving -i ./my-asset-folder -o ./my-target-folder -p my-assets/example',
    'prefixes all references in manifest file with "my-assets/example". e.g. file.txt becomes my-assets/example/file.txt'
  )

const flags = args.parse(process.argv, {
  usageFilter: usage => {
    console.log(`
  Revving is called a mechanism of providing assets with a fingerprint in its name
  so that the asset is cached at client side with a reference to its content.

  This allows to treat an asset as immutable as the asset name itself contains a version
  depending on its file content.

  This utility copies assets of a directory to target folder with renaming the assets,
  so that they contain a version hash.

  In example a file called file.txt becomes file-3b5d5c3712955042212316173ccf37be.txt.

  Additionally this utility creates a manifest.json file, that contains a map of all
  copied files in the form of

  {
      "file.txt": "file-3b5d5c3712955042212316173ccf37be.txt"
  }

  This manifest.json can be used to lookup the revved version in templates.
      `)
  }
})

if (flags.verbose) {
  transports.console.level = 'verbose'
}

const inputDir = flags.inputDirectory
const outputDir = flags.outputDirectory
const options = {
  copyOriginalFiles: !flags.dontCopyOriginalFiles && flags.copyOriginalFiles,
  mode: flags.mode,
  prefixPath: flags.prefixPath
}

revving
  .revFiles(inputDir, outputDir, options)
  .then(manifest => {
    logger.log('info', `copied files to ${outputDir}`)
    logger.log('info', `created ${path.join(outputDir, 'manifest.json')}`)
    logger.log('verbose', 'manifest.json', manifest)
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
