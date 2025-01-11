import { BuildHandlers, BuildJobDefinition, PackageJobDefinition } from '../../types'
import { PreBuildOptions } from '../types'
import { LinuxBuildHandler } from './linux'
import { MacBuildHandler } from './mac'
import { WindowsBuildHandler } from './windows'
import { GMSOptions, GMSProjectVersion } from '../../types'

export * from './base'
export * from './linux'
export * from './mac'
export * from './windows'

export const buildHandlers: BuildHandlers = {
  linux: LinuxBuildHandler,
  mac: MacBuildHandler,
  windows: WindowsBuildHandler,
}

export type BuildHandler = {
  getPlatformOptions(args: {
    projectPathname: string
    optionsFilename: string
  }): Promise<{ platformOptions: GMSOptions; optionsFile: Buffer; optionsPathname: string }>
  getBuildVersion(options: PreBuildOptions): Promise<GMSProjectVersion>
  setBuildVersion(version: GMSProjectVersion, options: PreBuildOptions): Promise<void>
  build(buildJob: BuildJobDefinition, moduleConfig?: any, options?: any): Promise<boolean>
  package(packageJob: PackageJobDefinition): Promise<void>
  outputDebugInfo(buildJob: BuildJobDefinition, moduleConfig?: any, options?: any): Promise<void>
}
