import { spawn } from 'child_process'
import { join } from 'path'
import fse from 'fs-extra'
import vdf from 'node-vdf'

import { DeployBase, DeployConfig } from './_base'
import { BuildDefinition } from '../build'
import { SteamModuleConfig } from '../../types'

export class Steam extends DeployBase {
  constructor(config: DeployConfig & SteamModuleConfig) {
    super(config)
  }

  async deploy(builds: BuildDefinition[]) {
    const { contentBuilderRoot, username, password, appid } = this.config as DeployConfig & SteamModuleConfig
    const buildVersions = builds
      .map((build) => build.platformName + ': ' + build.version)
      .filter((value, index, self) => self.indexOf(value) === index)

    const app_vdf_file = join(contentBuilderRoot, 'scripts', `app_build_${appid}.vdf`)
    const app_vdf = vdf.parse(String(await fse.readFile(app_vdf_file)))
    app_vdf.appbuild.desc = `Automatic build (${buildVersions.join(', ')})`
    await fse.writeFile(app_vdf_file, vdf.dump(app_vdf))
    console.log(app_vdf)

    await new Promise<void>((resolve) => {
      const steamArgs = ['+login', username, password, '+run_app_build_http', app_vdf_file, '+quit']
      console.log('steamcmd.exe', steamArgs.join(' '))

      const steam = spawn(join(contentBuilderRoot, 'builder', 'steamcmd.exe'), steamArgs)
      steam.stdout.on('data', (data) => console.log(data.toString()))
      steam.stderr.on('data', (data) => console.log(data.toString()))
      steam.on('close', async (_code) => {
        resolve()
      })
    })
  }
}
