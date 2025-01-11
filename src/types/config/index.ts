export * from './mac'
export * from './linux'
export * from './steam'
export * from './itch'

export type GlobalConfig = {
  gamemakerPath: string
  tempFolder: string
  deviceConfigFileLocation: string
  runtimeLocation?: string
  userDataLocation?: string
  buildRoot?: string
  deployRoot?: string
}

export type ArchitectureType = 'x86' | 'x64'

export type ArchitectureConfig = {
  buildFolder: string
}

export type PlatformType = 'windows' | 'mac' | 'linux'

export type PlatformConfig = {
  name: string
  optionsFile: string
  optionsVersionKey: string
  targetDeviceName?: string
  moduleConfig?: Record<string, unknown>
  architectures: Record<ArchitectureType, ArchitectureConfig>
  compileToVM?: boolean
}

export type ProjectPlatformConfig = Partial<PlatformConfig>

export type DeploymentTargetType = 'steam' | 'itch'

export type DeploymentTargetConfig = {
  name: string
  requiresEntitlements?: boolean
  alwaysUseSafeName?: boolean
  buildSuffix?: string
  moduleConfig?: Record<string, unknown>
}

export type ProjectDeploymentTargetConfig = {
  // buildRoot: string
  buildConfigs: Record<ArchitectureType, string>
  moduleConfig: Record<string, unknown>
}

export type BuildDeploymentTargetConfig = DeploymentTargetConfig & ProjectDeploymentTargetConfig

export type ProjectBranchConfig = {
  deploymentTargets: Record<string, ProjectDeploymentTargetConfig>
}

export type ProjectConfig = {
  name: string
  projectFile: string
  buildRoot?: string
  buildDir?: string
  deployRoot?: string
  deployDir?: string
  platforms: Record<string, ProjectPlatformConfig>
  deploymentTargets: Record<string, ProjectDeploymentTargetConfig>
  branches?: Record<string, ProjectBranchConfig>
}

export type BuildConfig = {
  gmsBuildConfig: string
  platform: PlatformType
  platformName: string
  platformBuildVersion: string
  projectKey: string
  projectName: string
  projectSafeName: string
  projectPath: string
}

export type RubberBandConfig = {
  global: GlobalConfig
  platforms: Record<PlatformType, PlatformConfig>
  deploymentTargets: Record<DeploymentTargetType, DeploymentTargetConfig>
  projects: Record<string, ProjectConfig>
}
