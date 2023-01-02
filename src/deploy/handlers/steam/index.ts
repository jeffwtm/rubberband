import { spawn } from 'child_process'
import { join } from 'path'
import fse from 'fs-extra'
import vdf from 'node-vdf'

import { BaseDeployHandler, DeployHandler } from '..'
import { DeployJobDefinition, SteamModuleConfig } from '../../../types'
import { createSteamAppVDF } from './utils'
import { getAbsolutePath, mergeDeep } from '../../../utils'
import { AppBuildFile } from './types'

export const SteamDeployHandler: DeployHandler = {
  ...BaseDeployHandler,
  async deploy(deployJob: DeployJobDefinition, moduleConfig: SteamModuleConfig) {
    const { tempFolder } = deployJob
    const { contentBuilderRoot, username, password, appid } = moduleConfig
    const buildVersions = deployJob.builds
      .map((build) => build.platformName + ': ' + build.version)
      .filter((value, index, self) => self.indexOf(value) === index)

    const vdfPath = join(tempFolder, 'steam', 'scripts')
    await fse.mkdirs(vdfPath)
    const appVdfFilepath = join(vdfPath, `app_build_${appid}.vdf`)
    let existingAppVdf = {}
    if (fse.existsSync(appVdfFilepath)) {
      existingAppVdf = vdf.parse(String(await fse.readFile(appVdfFilepath)))
    }

    const desc = `Automatic build (${buildVersions.join(', ')})`
    const newVdf = createSteamAppVDF(deployJob, moduleConfig, desc)

    const updatedVdf: AppBuildFile = mergeDeep(existingAppVdf, newVdf)

    await fse.writeFile(appVdfFilepath, vdf.dump(updatedVdf))

    await new Promise<void>((resolve) => {
      const steamCmdPath = getAbsolutePath(join(contentBuilderRoot, 'builder', 'steamcmd.exe'))
      const steamArgs = ['+login', username, password, '+run_app_build_http', appVdfFilepath, '+quit']
      const safeSteamArgs = [...steamArgs]
      safeSteamArgs[2] = password.replace(/./g, '*')

      console.log(steamCmdPath)
      console.log('steamcmd.exe', safeSteamArgs.join(' '))

      const steam = spawn(steamCmdPath, steamArgs)
      steam.stdout.on('data', (data) => console.log(data.toString()))
      steam.stderr.on('data', (data) => console.log(data.toString()))
      steam.on('close', async (_code) => {
        resolve()
      })
    })
  },
  async outputDebugInfo(deployJob: DeployJobDefinition, moduleConfig: SteamModuleConfig) {
    console.log('steam module config', moduleConfig)
    const { tempFolder } = deployJob
    const { appid, contentBuilderRoot } = moduleConfig
    const buildVersions = deployJob.builds
      .map((build) => build.platformName + ': ' + build.version)
      .filter((value, index, self) => self.indexOf(value) === index)

    console.log('contentBuilderRoot', getAbsolutePath(contentBuilderRoot))

    const vdfPath = join(tempFolder, 'steam', 'scripts')
    const appVdfFilepath = join(vdfPath, ` app_build_${appid}.vdf`)
    let existingAppVdf = {}
    if (fse.existsSync(appVdfFilepath)) {
      existingAppVdf = vdf.parse(String(await fse.readFile(appVdfFilepath)))
    }
    console.log('steam VDF parsed:', JSON.stringify(existingAppVdf, undefined, 2))

    const desc = `Automatic build (${buildVersions.join(', ')})`
    const newVdf = createSteamAppVDF(deployJob, moduleConfig, desc)
    console.log('steam VDF new:', vdf.dump(newVdf))
    const updatedVdf = mergeDeep(existingAppVdf, newVdf)
    console.log('steam VDF updated:', vdf.dump(updatedVdf))
  },
}
