import { spawn } from 'child_process'

import { BaseDeployHandler, DeployHandler } from '.'
import { DeployJobDefinition, ProjectItchModuleConfig } from '../../types'

export const ItchDeployHandler: DeployHandler = {
  ...BaseDeployHandler,
  async deploy(deployJob: DeployJobDefinition, moduleConfig: ProjectItchModuleConfig) {
    //butler push directory user/game:channel
    const { account, gameid, platforms } = moduleConfig

    for (const build of deployJob.builds) {
      const { channel } = platforms[build.platform]

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
  },
}
