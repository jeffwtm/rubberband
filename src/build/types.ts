import { PrepareBuildsOptions } from '../types'

export type PreBuildOptions = {
  projectPathname: string
  optionsFilename: string
  optionsVersionKey: string
} & PrepareBuildsOptions

export type BuildOptions = {
  skipBuilding?: boolean
  clean?: boolean
}
