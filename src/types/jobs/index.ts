import { IRubberOptions } from '@incominggames/gamemaker-rubber'

import { ArchitectureType, BuildDeploymentTargetConfig, DeploymentTargetType, PlatformType } from '../config'
import { GMSProjectVersion } from '../gamemaker'

export type BuildJobDefinition = {
  buildPath: string
  buildPlatform: PlatformType
  buildPlatformOptions: any
  compileOptions: IRubberOptions
  deploymentTarget: DeploymentTargetType
  deploymentTargetOptions: any
  logName: string
  platformName: string
  projectName: string
  projectPath: string
  projectSafeName: string
  projectSafeNameSuffixed: string
  version: string
}

export type PackageJobDefinition = {
  buildPath: string
  buildPlatform: PlatformType
  deploymentPath: string
  projectSafeNameSuffixed: string
}

export type DeployBuild = {
  architecture: ArchitectureType
  platform: PlatformType
  platformName: string
  version: GMSProjectVersion
  buildFolder: string
  deploymentPath: string
}

export type DeployJobDefinition = {
  builds: DeployBuild[]
  deployDir: string
  deploymentTarget: DeploymentTargetType
  deploymentTargetOptions: BuildDeploymentTargetConfig
  tempFolder: string
}

export type JobDefinition = BuildJobDefinition | PackageJobDefinition | DeployJobDefinition
