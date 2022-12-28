import { join } from 'path'
import { getProjectDeployDir, getProjectDeployRoot } from '..'
import { deployHandlers } from '../../deploy'
import {
  ArchitectureConfig,
  ArchitectureType,
  BuildDeploymentTargetConfig,
  DeployBuild,
  DeployJobDefinition,
  DeploymentTargetType,
  GlobalConfig,
  GMSProjectVersion,
  PlatformType,
  ProjectConfig,
} from '../../types'

export type GetDeployJobDefinitionArgs = {
  builds: DeployBuild[]
  deploymentTarget: DeploymentTargetType
  deploymentTargetOptions: BuildDeploymentTargetConfig
  globalConfig: GlobalConfig
  projectKey: string
  projectConfig: ProjectConfig
}

export type GetDeployBuildDefinitionArgs = {
  platform: PlatformType
  platformName: string
  version: GMSProjectVersion
  architecture: ArchitectureType
  architectureConfig: ArchitectureConfig
  deploymentTarget: DeploymentTargetType
  globalConfig: GlobalConfig
  projectKey: string
  projectConfig: ProjectConfig
}

export const getDeployJobDefinition = ({
  builds,
  deploymentTarget,
  deploymentTargetOptions,
  globalConfig,
  projectKey,
  projectConfig,
}: GetDeployJobDefinitionArgs): DeployJobDefinition => {
  const { tempFolder } = globalConfig
  const deployDir = getProjectDeployDir(globalConfig, projectKey, projectConfig, deploymentTarget)
  return {
    builds,
    deployDir,
    deploymentTarget,
    deploymentTargetOptions,
    tempFolder,
  }
}

export const getDeployBuildDefinition = ({
  platform,
  platformName,
  version,
  architecture,
  architectureConfig,
  deploymentTarget,
  globalConfig,
  projectKey,
  projectConfig,
}: GetDeployBuildDefinitionArgs): DeployBuild => {
  const { buildFolder } = architectureConfig
  const deployDir = getProjectDeployDir(globalConfig, projectKey, projectConfig, deploymentTarget)
  const deploymentPath = join(deployDir, buildFolder)
  return {
    architecture,
    buildFolder,
    deploymentPath,
    platform,
    platformName,
    version,
  }
}

export const executeDeployJob = async (deployJob: DeployJobDefinition) => {
  const { deploymentTarget, deploymentTargetOptions } = deployJob
  const deployHandler = deployHandlers[deploymentTarget]
  await deployHandler.deploy(deployJob, deploymentTargetOptions.moduleConfig)
}

export const debugDeployJob = async (deployJob: DeployJobDefinition) => {
  const { deploymentTarget, deploymentTargetOptions } = deployJob
  const deployHandler = deployHandlers[deploymentTarget]
  await deployHandler.outputDebugInfo(deployJob, deploymentTargetOptions.moduleConfig)
}
