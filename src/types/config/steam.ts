import { ArchitectureType } from '.'
import { VDFID } from '../../deploy/handlers/steam/types'

export type DeploymentTargetSteamModuleConfig = {
  contentBuilderRoot: string
  username: string
  password: string
}

export type ProjectSteamPlatformArchitectureConfig = {
  depotId: VDFID
}

export type ProjectSteamPlatformConfig = Record<ArchitectureType, ProjectSteamPlatformArchitectureConfig>

export type ProjectSteamModuleConfig = {
  appid: VDFID
  platforms: Record<string, ProjectSteamPlatformConfig>
  releaseToBranch?: string
}

export type SteamModuleConfig = DeploymentTargetSteamModuleConfig & ProjectSteamModuleConfig
