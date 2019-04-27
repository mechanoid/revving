const path = require('path')
const fs = require('fs-extra')
const hasha = require('hasha')
const { logger } = require('./logger.js')

const flattenArray = (arr, curr = []) => arr.concat(curr)

const collectFiles = async dir => {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true })

    const fileNames = await Promise.all(
      files.map(f => {
        const currentFile = path.join(dir, f.name)
        if (f.isDirectory()) {
          return collectFiles(currentFile)
        }

        return currentFile
      })
    )

    return fileNames.reduce(flattenArray, [])
  } catch (e) {
    throw e
  }
}

const hashedFileName = async filePath => {
  const hash = await hasha.fromFile(filePath, { algorithm: 'md5' })

  const dirname = path.dirname(filePath)
  const extname = path.extname(filePath)
  const basename = path.basename(filePath, extname)

  return path.join(dirname, `${basename}-${hash}${extname}`)
}

const stripSourceDirectory = (dirName, fileName) =>
  path.relative(dirName, fileName)

const manifestFilePaths = (inputDir, sourceFileName, targetFileName) => {
  const baseSourceFileName = stripSourceDirectory(inputDir, sourceFileName)
  const baseTargetFileName = stripSourceDirectory(inputDir, targetFileName)

  return [baseSourceFileName, baseTargetFileName]
}

const copyFileWithHashedName = (
  inputDir,
  outputDir,
  options = {}
) => async filePath => {
  const targetFilePath = await hashedFileName(filePath)

  const [baseSourceFileName, baseTargetFileName] = manifestFilePaths(
    inputDir,
    filePath,
    targetFilePath
  )

  try {
    if (options.copyOriginalFiles || options.mode !== 'production') {
      await fs.copy(
        path.join(filePath),
        path.join(outputDir, baseSourceFileName)
      )
    }
    await fs.copy(path.join(filePath), path.join(outputDir, baseTargetFileName))
  } catch (e) {
    throw e
  }

  logger.log('verbose', baseSourceFileName, baseTargetFileName)
  return [baseSourceFileName, baseTargetFileName]
}

const manifestRefPath = (file, options = {}) => {
  return options.prefixPath ? path.join(options.prefixPath, file) : file
}

const writeManifest = async (manifestFiles, outputDir, options = {}) => {
  const manifest = manifestFiles.reduce((res, curr) => {
    const originalFile = manifestRefPath(curr[0], options)

    const revvedFile =
      options.mode === 'development'
        ? originalFile
        : manifestRefPath(curr[1], options)

    res[originalFile] = revvedFile

    return res
  }, {})

  await fs.outputFile(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  )

  return manifest
}

const revFiles = async (inputDir, outputDir, options = {}) => {
  const files = await collectFiles(inputDir)

  logger.log('verbose', '\navailable files:')

  files.forEach(f => {
    logger.log('verbose', f)
  })

  await fs.ensureDir(outputDir)

  try {
    const manifestFiles = await Promise.all(
      files.map(copyFileWithHashedName(inputDir, outputDir, options))
    )

    const manifest = await writeManifest(manifestFiles, outputDir, options)

    return manifest
  } catch (e) {
    throw e
  }
}

module.exports = {
  revFiles,
  flattenArray,
  collectFiles,
  hashedFileName,
  stripSourceDirectory,
  copyFileWithHashedName
}
