import * as rubber from '@incominggames/gamemaker-rubber'

import AdmZip from 'adm-zip'
import fse from 'fs-extra'
import RJSON from 'relaxed-json'
import { dirname, join } from 'path'
import { BuildHandler } from '.'
import { GMSOptions, GMSProjectVersion, BuildJobDefinition, PackageJobDefinition } from '../../types'
import { PreBuildOptions } from '../types'

const logData = (data: any) => {
  const output = data.toString().trim()
  console.log(output)
}

export const BaseBuildHandler: BuildHandler = {
  async getPlatformOptions({ optionsFilename, projectPathname }) {
    const projectPath = dirname(projectPathname)
    const optionsPathname = join(projectPath, optionsFilename)

    const optionsFile = await fse.readFile(optionsPathname)
    const platformOptions = RJSON.parse(optionsFile.toString()) as GMSOptions

    return { platformOptions, optionsFile, optionsPathname }
  },
  async getBuildVersion(options: PreBuildOptions) {
    const { optionsFilename, optionsVersionKey, projectPathname, incrementBuild } = options
    const { platformOptions, optionsFile, optionsPathname } = await this.getPlatformOptions({
      optionsFilename,
      projectPathname,
    })

    let [major, minor, build] = platformOptions[optionsVersionKey]
      .split('.')
      .map((versionNumber) => parseInt(versionNumber))

    if (incrementBuild) {
      build++

      const updateVersionRegex = new RegExp(`(\\"${optionsVersionKey}\\"\\: ?\\")([0-9\\.]+)(\\")`)
      const updatedOptionsFile = optionsFile.toString().replace(updateVersionRegex, `$1${major}.${minor}.${build}$3`)
      await fse.writeFile(optionsPathname, updatedOptionsFile)
    }

    const version: GMSProjectVersion = `${major}.${minor}.${build}`
    // this.gmsPlatformOptions = options_platform

    return version
  },
  async setBuildVersion(version: GMSProjectVersion, options: PreBuildOptions) {
    const { optionsFilename, optionsVersionKey, projectPathname } = options
    const { optionsFile, optionsPathname } = await this.getPlatformOptions({
      optionsFilename,
      projectPathname,
    })

    const updateVersionRegex = new RegExp(`(\\"${optionsVersionKey}\\"\\: \\")([0-9\\.]+)(\\")`)
    const updatedOptionsFile = optionsFile.toString().replace(updateVersionRegex, `$1${version}$3`)
    await fse.writeFile(optionsPathname, updatedOptionsFile)
  },
  async build(buildJob: BuildJobDefinition, _moduleConfig: any, { clean }) {
    // this.logStream = fse.createWriteStream(__dirname + '/../../log/' + config.logName + '.log')
    const { buildPath, compileOptions } = buildJob

    await fse.mkdirs(buildPath)

    await new Promise<void>((resolve, reject) => {
      // console.log('compile options', compileOptions)
      const execution = rubber.compile(compileOptions, !!clean)
      execution.on('compileStatus', logData)
      execution.on('gameStatus', logData)
      execution.on('allFinished', async (errors) => {
        if (errors.length) {
          console.log(errors)
          return reject(errors)
        }

        resolve()
      })
    })

    return true
  },
  async package(packageJob: PackageJobDefinition) {
    const { deploymentPath, buildPath, projectSafeNameSuffixed } = packageJob
    const zip = new AdmZip(join(buildPath, projectSafeNameSuffixed + '.zip'))
    await fse.emptyDir(deploymentPath)
    zip.extractAllTo(deploymentPath)
  },
  async outputDebugInfo() {
    console.log(typeof this, 'debug info')
  },
}
