import { PrepareBuildsOptions } from '../types'

export type PreBuildOptions = {
  projectPathname: string
  optionsFilename: string
  optionsVersionKey: string
} & PrepareBuildsOptions
