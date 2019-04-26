const fs = require('fs-extra')
const path = require('path')
const tape = require('tape')
const revving = require('../../index.js')

const sampleDirPath = path.join(__dirname, 'fixtures', 'sample-dir')
const testTmpPath = path.join(__dirname, 'tmp')

const hashedName = async file => {
  const filePath = path.join(sampleDirPath, file)
  const filePathWithHash = await revving.hashedFileName(filePath)

  return filePathWithHash
}

const hashFromFileName = name => {
  const extname = path.extname(name)
  const basename = path.basename(name, extname)
  const splitted = basename.split('-')

  return splitted[splitted.length - 1]
}

tape.test('revFiles', tst => {
  tst.test('in default/production mode', async t => {
    const testTmpFolder = path.join(testTmpPath, 'revFiles-test')

    await revving.revFiles(sampleDirPath, testTmpFolder)

    const manifestPath = path.join(testTmpFolder, 'manifest.json')
    t.ok(fs.existsSync(manifestPath), 'manifest is created')

    const manifest = require(manifestPath)

    t.equal(
      manifest['file.txt'],
      'file-3b5d5c3712955042212316173ccf37be.txt',
      'manifest maps unrevved to revved assets'
    )

    t.end()
  })

  tst.test('in development mode', async t => {
    const testTmpFolder = path.join(testTmpPath, 'revFiles-development-test')

    await revving.revFiles(sampleDirPath, testTmpFolder, {
      mode: 'development'
    })

    const manifestPath = path.join(testTmpFolder, 'manifest.json')
    t.ok(fs.existsSync(manifestPath), 'manifest is created')

    const manifest = require(manifestPath)

    t.equal(
      manifest['file.txt'],
      'file.txt',
      'manifest maps unrevved to revved assets'
    )

    t.end()
  })

  tst.end()
})

tape.test('copyFileWithHashedName', tst => {
  tst.test('copy without original files', async t => {
    const testTmpFolder = path.join(testTmpPath, 'copyFileWithHashedName-test')
    const copyFile = revving.copyFileWithHashedName(
      sampleDirPath,
      testTmpFolder
    )

    const testFilePath = path.join(sampleDirPath, 'file.txt')

    await copyFile(testFilePath)

    t.ok(
      fs.existsSync(
        path.join(testTmpFolder, 'file-3b5d5c3712955042212316173ccf37be.txt')
      ),
      'hashed file version has been copied to target folder'
    )

    t.notOk(
      fs.existsSync(path.join(testTmpFolder, 'file.txt')),
      'original file has not been copied to target folder'
    )

    t.end()
  })

  tst.test('copy with original files', async t => {
    const testTmpFolder = path.join(
      testTmpPath,
      'copyFileWithHashedNameWithOriginals-test'
    )
    const copyFile = revving.copyFileWithHashedName(
      sampleDirPath,
      testTmpFolder,
      { copyOriginalFiles: true }
    )

    const testFilePath = path.join(sampleDirPath, 'file.txt')

    await copyFile(testFilePath)

    t.ok(
      fs.existsSync(
        path.join(testTmpFolder, 'file-3b5d5c3712955042212316173ccf37be.txt')
      ),
      'hashed file version has been copied to target folder'
    )

    t.ok(
      fs.existsSync(path.join(testTmpFolder, 'file.txt')),
      'original file has been copied to target folder'
    )

    t.end()
  })

  tst.end()
})

tape.test('collectFiles', async t => {
  const files = await revving.collectFiles(
    path.resolve(__dirname, 'fixtures/sample-dir')
  )

  const sampleFiles = [
    '.dot-file',
    'file-without-ext',
    'file.txt',
    'nested/file.txt'
  ]

  files.forEach(f => {
    const sampleFilePath = path.relative(sampleDirPath, f)

    t.equal(
      sampleFiles[sampleFiles.indexOf(sampleFilePath)],
      sampleFilePath,
      `${sampleFilePath} is one of the expected sample files`
    )
  })

  t.equal(
    files.length,
    4,
    'all files should be found, including dot-files and nested files'
  )

  t.end()
})

tape.test('hashedFileName', async t => {
  const dotFileWithHash = await hashedName('.dot-file')
  const nestedFileWithHash = await hashedName('nested/file.txt')
  const extlessFileWithHash = await hashedName('file-without-ext')
  const alternateContentWithHash = await hashedName('file.txt')

  t.equal(
    path.basename(dotFileWithHash),
    '.dot-file-60b725f10c9c85c70d97880dfe8191b3',
    'dot files should be revved correctly'
  )

  t.equal(
    path.relative(sampleDirPath, nestedFileWithHash),
    'nested/file-60b725f10c9c85c70d97880dfe8191b3.txt',
    'nested files should be revved correctly'
  )

  t.equal(
    path.relative(sampleDirPath, extlessFileWithHash),
    'file-without-ext-60b725f10c9c85c70d97880dfe8191b3',
    'files without ext should be revved correctly'
  )

  t.equal(
    hashFromFileName(extlessFileWithHash),
    hashFromFileName(nestedFileWithHash),
    'same content should have same hash'
  )

  t.notEqual(
    hashFromFileName(alternateContentWithHash),
    hashFromFileName(nestedFileWithHash),
    'different content should result in different hash'
  )

  t.end()
})

tape.test('stripSourceDirectory', t => {
  t.equal(
    revving.stripSourceDirectory(
      sampleDirPath,
      path.join(sampleDirPath, 'nested/file.txt')
    ),
    'nested/file.txt'
  )

  t.end()
})

tape.test('flattenArray', t => {
  t.deepEqual(
    revving.flattenArray([], []),
    [],
    'array element should be combined for empty arrays'
  )

  t.deepEqual(
    revving.flattenArray(['a', 'b'], ['c']),
    ['a', 'b', 'c'],
    'array with elements should be combined'
  )

  t.deepEqual(
    revving.flattenArray(['a', 'b', 'c'], ['c']),
    ['a', 'b', 'c', 'c'],
    'array with redundant elements should be contained'
  )

  t.deepEqual(
    revving.flattenArray(['a', 'b', 'c'], 'c'),
    ['a', 'b', 'c', 'c'],
    'plain elements should be combined'
  )

  t.end()
})

tape.onFinish(async () => {
  fs.remove(testTmpPath)
})
