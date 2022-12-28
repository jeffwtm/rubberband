import { BuildHandler } from '.'
import fse from 'fs-extra'
import { PreBuildOptions } from '../types'
import { GMSProjectVersion } from '../../types'
import { BaseBuildHandler } from './base'

export const WindowsBuildHandler: BuildHandler = {
  ...BaseBuildHandler,
  getBuildVersion: async function (config: PreBuildOptions) {
    const { optionsFilename, optionsVersionKey, projectPathname, incrementBuild } = config
    console.log('obj', BaseBuildHandler, this)
    const { platformOptions, optionsFile, optionsPathname } = await this.getPlatformOptions({
      optionsFilename,
      projectPathname,
    })

    let [major, minor, build, revision] = platformOptions[optionsVersionKey]
      .split('.')
      .map((versionNumber) => parseInt(versionNumber))

    if (incrementBuild) {
      build++

      const updateVersionRegex = new RegExp(`(\\"${optionsVersionKey}\\"\\: \\")([0-9\\.]+)(\\")`)
      const updatedOptionsFile = optionsFile
        .toString()
        .replace(updateVersionRegex, `$1${major}.${minor}.${build}.${revision}$3`)
      await fse.writeFile(optionsPathname, updatedOptionsFile)
    }

    const version: GMSProjectVersion = `${major}.${minor}.${build}.${revision}`

    return version
  },
}
