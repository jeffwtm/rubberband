import { IRubberOptions } from '@incominggames/gamemaker-rubber'
import { BuildHandler } from '../../build/handlers'
import { DeployHandler } from '../../deploy/handlers'
import { PlatformType } from '../config'

export type BuildAction = 'build' | 'package' | 'deploy'

export type BuildHandlers = Record<PlatformType, BuildHandler>

export type PrepareBuildsOptions = {
  actions?: BuildAction[]
  incrementBuild?: boolean
  keepVersionsInSync?: boolean
  projects?: string[]
  platforms?: string[]
  architectures?: string[]
  deploymentTargets?: string[]
  branch?: string
}

export type BuildDefinition = {
  buildPath: string
  compileOptions: IRubberOptions
  deployHandler: DeployHandler
  deployHandlerOptions: any
  deploymentPath: string
  logName: string
  buildHandler: BuildHandler
  buildHandlerOptions: any
  platformName: string
  projectPath: string
  projectName: string
  projectSafeName: string
  projectSafeNameSuffixed: string
  version: string
}
