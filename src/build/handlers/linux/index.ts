import { BuildHandler } from '..'
import { BuildJobDefinition, LinuxModuleConfig } from '../../../types'
import { Shell } from '../../../utils'
import { BaseBuildHandler } from '../base'
import { createTestCopy } from './utils'

export type LinuxBuildOptions = {
  skipBuilding?: boolean
  clean?: boolean
}

export const LinuxBuildHandler: BuildHandler = {
  ...BaseBuildHandler,
  async build(buildJob: BuildJobDefinition, moduleConfig: LinuxModuleConfig, options: LinuxBuildOptions) {
    const { host, username, password } = moduleConfig
    const { skipBuilding, clean } = options
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

      if (!skipBuilding) await BaseBuildHandler.build(buildJob, moduleConfig, options)

      const destName = buildJob.deploymentTargetOptions.alwaysUseSafeName
        ? buildJob.projectSafeName
        : buildJob.projectName

      if (!clean) {
        await createTestCopy(
          {
            sh,
            gamemakerPath: '~/',
            appSource: `${buildJob.projectSafeName}.zip`,
            testFilePath: `~/automated-tests/${destName}-${buildJob.deploymentTargetOptions.buildSuffix}.zip`,
            extractFolder: `~/automated-tests/${destName}-${buildJob.deploymentTargetOptions.buildSuffix}`,
          },
          () => {}
          // this.logData
        )
      }
      success = true
    } catch (e) {
      console.log('Error while creating test copy:', String(e))
    } finally {
      await sh.close()
    }

    return success
  },
}
