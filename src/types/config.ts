export * from './mac'
export * from './steam'
export * from './itch'

export type GlobalConfig = {
  gamemakerPath: string
  tempFolder: string
  deviceConfigFileLocation: string
}

export type ArchitectureType = 'x86' | 'x64'

export type ArchitectureConfig = {
  buildFolder: string
}

export type PlatformConfig = {
  name: string
  module: string
  optionsFile: string
  optionsVersionKey: string
  targetDeviceName?: string
  moduleConfig?: Record<string, unknown>
  architectures: Record<ArchitectureType, ArchitectureConfig>
} & Record<string, unknown>

export type DeploymentTargetConfig = {
  name: string
  module: string
  requiresEntitlements?: boolean
  alwaysUseSafeName?: boolean
  buildSuffix?: string
  moduleConfig?: Record<string, unknown>
}

export type ProjectPlatformConfig = {
  moduleConfig?: Record<string, unknown>
} & Record<string, unknown>

export type ProjectDeploymentTargetConfig = {
  buildRoot: string
  buildConfigs: Record<ArchitectureType, string>
  moduleConfig: Record<string, unknown>
} & Record<string, unknown>

export type ProjectConfig = {
  name: string
  projectFile: string
  buildDir: string
  platforms: Record<string, ProjectPlatformConfig>
  deploymentTargets: Record<string, ProjectDeploymentTargetConfig>
}

export type Config = {
  global: GlobalConfig
  platforms: Record<string, PlatformConfig>
  deploymentTargets: Record<string, DeploymentTargetConfig>
  projects: Record<string, ProjectConfig>
}