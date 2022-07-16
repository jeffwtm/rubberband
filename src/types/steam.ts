import { ArchitectureType } from './config'

export type SteamModuleConfig = {
  contentBuilderRoot: string
  username: string
  password: string
}

export type ProjectSteamPlatformArchitectureConfig = {
  depotId: string
}

export type ProjectSteamPlatformConfig = Record<ArchitectureType, ProjectSteamPlatformArchitectureConfig>

export type ProjectSteamModuleConfig = {
  appid: string
  platforms: Record<string, ProjectSteamPlatformConfig>
}
