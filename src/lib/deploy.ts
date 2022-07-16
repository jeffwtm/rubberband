import config_yaml from 'config-yaml'
import { Config } from '../types'

export const deploy = async (options?: any) => {
  const config: Config = config_yaml(__dirname + '/../config.yml')

  for (const project in config.projects) {
    if (options.projects && !options.projects.includes(project)) continue

    const projectConfig = config.projects[project]

    for (const platform in config.platforms) {
      projectConfig.platforms[platform] = Object.assign(config.platforms[platform], projectConfig.platforms[platform])
    }

    for (const deploymentTarget in config.deploymentTargets) {
      if (options.deploymentTargets && !options.deploymentTargets.includes(deploymentTarget)) continue

      const deploymentConfig = Object.assign(
        config.deploymentTargets[deploymentTarget],
        projectConfig.deploymentTargets[deploymentTarget]
      )
      console.log(`deploying to ${deploymentTarget}`)

      const deploymentModule = require(deploymentConfig.module)
      const module = new deploymentModule(deploymentConfig)

      await module.preDeploy(projectConfig)
      await module.deploy(projectConfig)
      await module.postDeploy(projectConfig)

      console.log(`${projectConfig.name} deployed to ${deploymentTarget}.`)
    }
  }
}
