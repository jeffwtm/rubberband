export type ProjectItchModulePlatformConfig = {
  channel: string
}

export type ProjectItchModuleConfig = {
  account: string
  gameid: string
  platforms: Record<string, ProjectItchModulePlatformConfig>
}