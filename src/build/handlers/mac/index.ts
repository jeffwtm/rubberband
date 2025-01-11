import { BuildHandler } from '..'
import fse from 'fs-extra'
import { join } from 'path'

import { signAndNotarize } from './utils'
import { Shell } from '../../../utils/shell'
import { BuildJobDefinition, MacModuleConfig, PackageJobDefinition } from '../../../types'
import { BaseBuildHandler } from '../base'
import { decrypt, getDevices, getLicense } from '../../../utils'

export type MacBuildOptions = {
  skipBuilding?: boolean
}

export const MacBuildHandler: BuildHandler = {
  ...BaseBuildHandler,
  async build(buildJob: BuildJobDefinition, moduleConfig: MacModuleConfig, { skipBuilding }: MacBuildOptions) {
    const localOutputPath = buildJob.buildPath
    buildJob.compileOptions.outputPath = join(localOutputPath, `${buildJob.projectSafeNameSuffixed}-unsigned.zip`)

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
    } = moduleConfig
    const sshConfig = {
      host,
      username,
      password,
    }
    const sh = new Shell(sshConfig, true)
    // console.log(this.logData)
    // const _log = this.logData
    // sh.on('output', (data) => _log(data))
    let success = false

    try {
      await sh.connect()
      await sh.exec('nohup caffeinate &>/dev/null </dev/null &')

      if (!skipBuilding) await BaseBuildHandler.build(buildJob)

      await fse.mkdirs(localOutputPath)

      success = await signAndNotarize(
        {
          sh,
          password,
          buildPath,
          gamemakerPath: '', // this.gmsPlatformOptions.option_mac_output_dir,
          appSource: buildJob.projectSafeName,
          appDest: buildJob.deploymentTargetOptions.alwaysUseSafeName ? buildJob.projectSafeName : buildJob.projectName,
          appNotarized: buildJob.projectSafeNameSuffixed,
          appleUser,
          applePassword,
          providerShortName,
          signingCertificate,
          bundleid,
          localOutputPath,
          useEntitlements: buildJob.deploymentTargetOptions.requiresEntitlements,
        },
        () => {}
        // this.logData
      )
    } catch (e) {
      console.log('Error:', String(e))
    } finally {
      await sh.exec('pkill -KILL caffeinate')
      await sh.close()
    }

    return success
  },
  async package(packageJob: PackageJobDefinition) {
    await BaseBuildHandler.package(packageJob)

    const { deploymentPath } = packageJob
    await fse.remove(join(deploymentPath, '__MACOSX'))
  },
  async outputDebugInfo(buildJob: BuildJobDefinition) {
    const devices = await getDevices()
    const macDevices = devices.mac

    const targetDevice = macDevices[buildJob.compileOptions.targetDeviceName ?? '']
    const license = (await getLicense()) as any

    const password = decrypt(targetDevice?.encrypted_password, license.email)

    console.log('devices', targetDevice, license, license.email, password)
  },
}
