import { spawn } from 'child_process'

import { BuildDefinition } from '../build'
import { DeployBase, DeployConfig } from './_base'
import { ProjectItchModuleConfig } from '../../types'

export class Itch extends DeployBase {
  constructor(config: DeployConfig) {
    super(config)
  }

  async deploy(builds: BuildDefinition[]) {
    //butler push directory user/game:channel
    const { account, gameid, platforms } = this.config as DeployConfig & ProjectItchModuleConfig

    for (const build of builds) {
      if (typeof build.deploymentModule !== typeof this) continue

      const platformConfig = Object.assign({}, platforms[build.compileOptions.platform])
      const { channel } = platformConfig

      await new Promise<void>((resolve) => {
        const butlerArgs = [
          'push',
          build.deploymentPath,
          `${account}/${gameid}:${channel}`,
          '--userversion',
          build.version,
        ]
        console.log('butler', butlerArgs.join(' '))

        const butler = spawn('butler', butlerArgs)
        butler.stdout.on('data', (data: any) => console.log(data.toString()))
        butler.stderr.on('data', (data: any) => console.log(data.toString()))
        butler.on('close', async (_code: any) => {
          resolve()
        })
      })
    }
  }
}
