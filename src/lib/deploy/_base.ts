import { DeploymentTargetConfig, ProjectDeploymentTargetConfig } from '../../types'
import { BuildDefinition } from '../build'

export type DeployConfig = Partial<DeploymentTargetConfig> & Partial<ProjectDeploymentTargetConfig>

export class DeployBase {
  config: DeployConfig

  constructor(config: DeployConfig) {
    const defaultConfig = {}

    this.config = Object.assign(defaultConfig, config)
  }

  async preDeploy() {
    //nothing
  }

  async deploy(_builds: BuildDefinition[]) {
    //nothing
  }

  async postDeploy() {
    //nothing
  }
}
