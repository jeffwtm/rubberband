import { BuildBase } from './_base'
import fse from 'fs-extra'
import { join } from 'path'

import { signAndNotarize } from '../macOsNotarize'
import { Shell } from '../shell'
import { MacModuleConfig } from '../../types'
import { BuildDefinition } from '../build'

export type MacBuildOptions = {
  skipBuilding?: boolean
}

export default class MacBuild extends BuildBase {
  constructor(options: MacModuleConfig) {
    super(options)
  }

  async build(config: BuildDefinition, { skipBuilding }: MacBuildOptions) {
    const localOutputPath = config.buildPath
    config.compileOptions.outputPath = join(localOutputPath, `${config.projectSafeNameSuffixed}-unsigned.zip`)

    const {
      host,
      username,
      password,
      buildPath,
      appleUser,
      applePassword,
      providerShortName,
      signingCertificate,
      bundleid,
    } = this.options
    const sshConfig = {
      host,
      username,
      password,
    }
    const sh = new Shell(sshConfig, true)
    console.log(this.logData)
    const _log = this.logData
    sh.on('output', (data) => _log(data))
    let success = false

    try {
      await sh.connect()
      await sh.exec('nohup caffeinate &>/dev/null </dev/null &')

      if (!skipBuilding) await super.build(config)

      await fse.mkdirs(localOutputPath)

      success = await signAndNotarize(
        {
          sh,
          password,
          buildPath,
          gamemakerPath: this.gmsPlatformOptions.option_mac_output_dir,
          appSource: config.projectSafeName,
          appDest: config.deploymentOptions.alwaysUseSafeName ? config.projectSafeName : config.projectName,
          appNotarized: config.projectSafeNameSuffixed,
          appleUser,
          applePassword,
          providerShortName,
          signingCertificate,
          bundleid,
          localOutputPath,
          useEntitlements: config.deploymentOptions.requiresEntitlements,
        },
        this.logData
      )
    } catch (e) {
      console.log('Error:', String(e))
    } finally {
      await sh.exec('pkill -KILL caffeinate')
      await sh.close()
    }

    return success
  }

  async package(config: BuildDefinition) {
    await super.package(config)

    const { deploymentPath } = config
    await fse.remove(join(deploymentPath, '__MACOSX'))
  }
}
