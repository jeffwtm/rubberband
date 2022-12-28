import { DeployJobDefinition, SteamModuleConfig } from '../../../types'
import { AppBuildFile } from './types'

export const createSteamAppVDF = (
  deployJob: DeployJobDefinition,
  moduleConfig: SteamModuleConfig,
  description: string
) => {
  const { builds, deployDir } = deployJob
  //   const { buildRoot } = deployJob.deploymentTargetOptions
  const { appid, platforms, releaseToBranch } = moduleConfig
  const setLive = releaseToBranch ? { SetLive: releaseToBranch } : {}
  const vdf: AppBuildFile = {
    AppBuild: {
      AppID: appid,
      Desc: description,
      ...setLive,
      ContentRoot: deployDir,
      BuildOutput: '../output/',
      Depots: Object.fromEntries(
        builds.map(({ platform, architecture, buildFolder }) => [
          platforms[platform][architecture].depotId,
          {
            FileMapping: {
              LocalPath: `${buildFolder}\\*`,
              DepotPath: '.',
              Recursive: '1',
            },
            FileExclusion: '*.pdb',
          },
        ])
      ),
    },
  }
  return vdf
}
