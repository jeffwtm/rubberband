import { IRubberOptions } from '@incominggames/gamemaker-rubber'
import { join } from 'path'
import { getProjectBuildDir } from '..'
import { BuildOptions } from '../../build'
import { buildHandlers } from '../../build/handlers'
import {
  BuildConfig,
  PlatformConfig,
  ArchitectureConfig,
  ProjectConfig,
  GlobalConfig,
  BuildDeploymentTargetConfig,
  BuildJobDefinition,
  DeploymentTargetType,
} from '../../types'

export type GetBuildJobDefinitionArgs = {
  buildConfig: BuildConfig
  platformConfig: PlatformConfig
  architectureConfig: ArchitectureConfig
  projectConfig: ProjectConfig
  globalConfig: GlobalConfig
  buildPlatformOptions: any
  deploymentTarget: DeploymentTargetType
  deploymentTargetOptions: BuildDeploymentTargetConfig
}

export const getBuildJobDefinition = ({
  buildConfig,
  platformConfig,
  architectureConfig,
  projectConfig,
  globalConfig,
  buildPlatformOptions,
  deploymentTarget,
  deploymentTargetOptions,
}: GetBuildJobDefinitionArgs): BuildJobDefinition => {
  const {
    gmsBuildConfig,
    platform,
    platformName,
    platformBuildVersion,
    projectKey,
    projectName,
    projectSafeName,
    projectPath,
  } = buildConfig

  const { gamemakerPath, tempFolder, deviceConfigFileLocation, runtimeLocation, userDataLocation } = globalConfig
  const { targetDeviceName, compileToVM, optionsFile, optionsVersionKey } = platformConfig
  const { buildFolder } = architectureConfig
  const { projectFile } = projectConfig

  const buildDir = getProjectBuildDir(globalConfig, projectKey, projectConfig)

  const job: BuildJobDefinition = {
    buildPath: join(buildDir, buildFolder, platformBuildVersion),
    buildPlatform: platform,
    buildPlatformOptions,
    compileOptions: {
      projectPath: projectFile,
      runtimeLocation,
      yyc: !compileToVM,
      verbose: true,
      config: gmsBuildConfig,
      build: 'zip',
      outputPath: join(
        buildDir,
        buildFolder,
        platformBuildVersion,
        `${projectSafeName}-${deploymentTargetOptions.buildSuffix}.zip`
      ),
      gamemakerLocation: gamemakerPath,
      tempFolder,
      deviceConfigFileLocation,
      userDataLocation,
      targetDeviceName,
      platform: platform as IRubberOptions['platform'],
    },
    deploymentTarget,
    deploymentTargetOptions,
    logName: `${projectSafeName}-${platform}-${deploymentTargetOptions.buildSuffix}`,
    optionsFile,
    optionsVersionKey,
    platformName,
    projectPath,
    projectName,
    projectSafeName,
    projectSafeNameSuffixed: `${projectSafeName}-${deploymentTargetOptions.buildSuffix}`,
    version: platformBuildVersion,
  }

  return job
}

export const executeBuildJob = async (buildJob: BuildJobDefinition, options?: BuildOptions) => {
  const { buildPlatform, buildPlatformOptions } = buildJob
  const buildHandler = buildHandlers[buildPlatform]
  await buildHandler.build(buildJob, buildPlatformOptions, options)
}

export const debugBuildJob = async (buildJob: BuildJobDefinition, options?: BuildOptions) => {
  const { buildPlatform, buildPlatformOptions } = buildJob
  const buildHandler = buildHandlers[buildPlatform]
  await buildHandler.outputDebugInfo(buildJob, buildPlatformOptions, options)
}
