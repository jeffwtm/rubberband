export type PlatformMacModuleConfig = {
  host: string
  username: string
  password: string
  buildPath: string
  appleUser: string
  applePassword: string
  providerShortName: string
  signingCertificate: string
}

export type ProjectMacModuleConfig = {
  bundleid: string
}

export type MacModuleConfig = PlatformMacModuleConfig & ProjectMacModuleConfig
