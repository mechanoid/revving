# revving

Revving is called a mechanism of providing assets with a fingerprint in its name
so that the asset is cached at client side with a reference to its content.

This allows to treat an asset as immutable as the asset name itself contains a version
depending on its file content.

This utility copies assets of a directory to target folder with renaming the assets,
so that they contain a version hash.

In example a file called `file.txt` becomes `file-3b5d5c3712955042212316173ccf37be.txt`.

Additionally this utility creates a `manifest.json` file, that contains a map of all
copied files in the form of

```
{
"file.txt": "file-3b5d5c3712955042212316173ccf37be.txt"
}
```

This `manifest.json` can be used to lookup the revved version in templates.

```
npx revving -h

  Usage: revving [options] [command]

  Commands:
    help     Display help
    version  Display version

  Options:
    -c, --copy-original-files  also copy the not hashed files to the target dir (disabled by default)
    -h, --help                 Output usage information
    -i, --input-directory      asset directory which contained files should be revved
    -m, --mode [value]         mode can be "development", "production" or "auto".
      In "production" mode only revved files are copied, if not accompanied by --copy-original-files.
      The revved files are referenced in the manifest file then.

      In "development" mode, the manifest reflects the orginal file names. This is helpful in that
      the manifest.json file still needs only to be required once. And changes
      of the asset contents do not need to result in a re-read of the manifest.json.

      The "auto" value sets the property value to what is set as NODE_ENV environment variable.
      When NODE_ENV is set to "production" it is production, otherwise it is "development".

      NOTE: if mode is equal to "development" all original files will always be copied, disregards
      to --copy-original-files or --dont-copy-original-files
 (defaults to "production")
    -o, --output-directory     target directory for the revved files
    -v, --version              Output the version number

  Examples:
    - selecting the folder which should be provided with revved versions
    $ revving -i ./my-asset-folder

    - selecting the folder where the revved assets should be copied to
    $ revving -o ./my-target-folder

    - defaults to "production" mode. Copies original and revved files to ./my-target-folder
    $ revving -i ./my-asset-folder -o ./my-target-folder

    - copying only revved files to ./my-target-folder
    $ revving -i ./my-asset-folder -o ./my-target-folder -m production

    - copying only revved files to ./my-target-folder
    $ revving -i ./my-asset-folder -o ./my-target-folder -m production

    - copying original and revved files to ./my-target-folder
    $ revving -i ./my-asset-folder -o ./my-target-folder -m production -c

    - copying original and revved files to ./my-target-folder. Manifest references the original file names
    $ revving -i ./my-asset-folder -o ./my-target-folder -m development

    - same as -m production
    $ NODE_ENV=production revving -i ./my-asset-folder -o ./my-target-folder -m auto

    - same as -m development
    $ NODE_ENV=development revving -i ./my-asset-folder -o ./my-target-folder -m auto
```
