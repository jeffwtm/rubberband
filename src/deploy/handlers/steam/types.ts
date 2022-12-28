export type VDFID = `${number}`

export type AppBuildFile = {
  AppBuild: {
    AppID: VDFID
    Desc: string
    Preview?: '1' | '0'
    Local?: string
    SetLive?: string
    ContentRoot: string
    BuildOutput: string
    Depots: Record<VDFID, DepotProps | string>
  }
}

export type DepotBuildFile = {
  DepotBuild: {
    DepotID: VDFID
  } & DepotProps
}

export type DepotProps = {
  FileMapping: {
    LocalPath: string
    DepotPath: string
    Recursive: '1' | '0'
  }
  FileExclusion?: string
}
