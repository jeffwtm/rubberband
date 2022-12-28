import { join } from 'path'
import { DeploymentTargetType, GlobalConfig, ProjectConfig } from '../types'

export * from './shell'
export * from './misc'
export * from './jobs'

export const getProjectBuildRoot = (globalConfig: GlobalConfig, projectConfig: ProjectConfig) =>
  projectConfig.buildRoot ?? globalConfig.buildRoot ?? join(__dirname, 'build')

export const getProjectBuildDir = (
  globalConfig: GlobalConfig,
  project: string,
  projectConfig: ProjectConfig
): string => {
  const buildRoot = getProjectBuildRoot(globalConfig, projectConfig)
  return projectConfig.buildDir ?? join(buildRoot, project)
}

export const getProjectDeployRoot = (globalConfig: GlobalConfig, projectConfig: ProjectConfig) =>
  projectConfig.deployRoot ?? globalConfig.deployRoot ?? join(__dirname, 'deploy')

export const getProjectDeployDir = (
  globalConfig: GlobalConfig,
  project: string,
  projectConfig: ProjectConfig,
  deploymentTarget: DeploymentTargetType
): string => {
  const deployRoot = getProjectDeployRoot(globalConfig, projectConfig)
  return projectConfig.deployDir ?? join(deployRoot, project, deploymentTarget)
}
