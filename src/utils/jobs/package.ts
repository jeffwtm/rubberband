import { join } from 'path'
import { getProjectBuildDir, getProjectDeployDir } from '..'
import { buildHandlers } from '../../build/handlers'
import {
  ArchitectureConfig,
  BuildDeploymentTargetConfig,
  DeploymentTargetType,
  GlobalConfig,
  GMSProjectVersion,
  PackageJobDefinition,
  PlatformType,
  ProjectConfig,
} from '../../types'

export type GetPackageJobDefinitionArgs = {
  buildPlatform: PlatformType
  architectureConfig: ArchitectureConfig
  projectKey: string
  projectConfig: ProjectConfig
  projectSafeName: string
  version: GMSProjectVersion
  deploymentTarget: DeploymentTargetType
  deploymentTargetOptions: BuildDeploymentTargetConfig
  globalConfig: GlobalConfig
}

export const getPackageJobDefinition = ({
  buildPlatform,
  architectureConfig,
  projectKey,
  projectConfig,
  projectSafeName,
  version,
  deploymentTarget,
  deploymentTargetOptions,
  globalConfig,
}: GetPackageJobDefinitionArgs): PackageJobDefinition => {
  const { buildFolder } = architectureConfig

  const buildDir = getProjectBuildDir(globalConfig, projectKey, projectConfig)
  const deployDir = getProjectDeployDir(globalConfig, projectKey, projectConfig, deploymentTarget)

  const buildPath = join(buildDir, buildFolder, version)
  const deploymentPath = join(deployDir, buildFolder)
  const projectSafeNameSuffixed = `${projectSafeName}-${deploymentTargetOptions.buildSuffix}`

  return {
    buildPath,
    buildPlatform,
    deploymentPath,
    projectSafeNameSuffixed,
  }
}

export const executePackageJob = async (packageJob: PackageJobDefinition) => {
  const { buildPlatform } = packageJob
  const buildHandler = buildHandlers[buildPlatform]
  await buildHandler.package(packageJob)
}
