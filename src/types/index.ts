import { BuildAction } from './build'
import { BuildJobDefinition, DeployJobDefinition, JobDefinition, PackageJobDefinition } from './jobs'

export * from './config'
export * from './build'
export * from './deploy'
export * from './jobs'
export * from './gamemaker'

export type CLIArguments = {
  skipBuilding?: boolean
  config?: string
  options?: string
  checkConfig?: boolean
  debug?: boolean
}

export interface RubberBandJobs extends Record<BuildAction, JobDefinition[]> {
  build: BuildJobDefinition[]
  package: PackageJobDefinition[]
  deploy: DeployJobDefinition[]
}
