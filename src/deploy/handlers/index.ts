import { BuildDefinition, DeployHandlers, DeployJobDefinition } from '../../types'
import { ItchDeployHandler } from './itch'
import { SteamDeployHandler } from './steam'

export * from './itch'
export * from './steam'

export const deployHandlers: DeployHandlers = {
  itch: ItchDeployHandler,
  steam: SteamDeployHandler,
}

export type DeployHandler = {
  preDeploy(): Promise<void>
  deploy(deployJob: DeployJobDefinition, moduleConfig?: any): Promise<void>
  postDeploy(): Promise<void>
  outputDebugInfo(deployJob: DeployJobDefinition, moduleConfig?: any): Promise<void>
}

export const BaseDeployHandler: DeployHandler = {
  async preDeploy() {},
  async deploy(_deployJob: DeployJobDefinition) {},
  async postDeploy() {},
  async outputDebugInfo() {
    console.log(typeof this, 'debug info')
  },
}
