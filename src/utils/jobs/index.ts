import { dirname, basename, extname } from 'path'
import { BuildHandler, buildHandlers } from '../../build/handlers'
import {
  RubberBandConfig,
  PrepareBuildsOptions,
  ArchitectureType,
  BuildConfig,
  BuildDeploymentTargetConfig,
  PlatformConfig,
  RubberBandJobs,
  ProjectConfig,
  PlatformType,
  DeploymentTargetType,
  ProjectBranchConfig,
  VersionComponents,
  GMSProjectVersion,
} from '../../types'
import { BuildJobDefinition, DeployJobDefinition, PackageJobDefinition } from '../../types/jobs'
import { getHighestVersion, mergeDeep, parseVersionComponents } from '../misc'
import { debugBuildJob, executeBuildJob, getBuildJobDefinition } from './build'
import { debugDeployJob, executeDeployJob, getDeployBuildDefinition, getDeployJobDefinition } from './deploy'
import { executePackageJob, getPackageJobDefinition } from './package'

export * from './build'
export * from './package'
export * from './deploy'

const versions: VersionComponents[] = []
let syncVersion: GMSProjectVersion

export const prepareJobs = async (
  config: RubberBandConfig,
  options: PrepareBuildsOptions = {}
): Promise<RubberBandJobs> => {
  const jobs = await Promise.all(
    Object.entries(config.projects)
      .filter(([project]) => !options.projects || options.projects.includes(project))
      .map(async ([project, projectConfig]) => {
        const branchConfig: Partial<ProjectBranchConfig> =
          (!!options.branch && projectConfig.branches?.[options.branch]) || {}
        return getProjectJobs(project, mergeDeep(projectConfig, branchConfig), config, options)
      })
  )

  const buildJobs = jobs.map((job) => job.build).flat()
  const packageJobs = jobs.map((job) => job.package).flat()
  const deployJobs = jobs.map((job) => job.deploy).flat()

  syncVersion = getHighestVersion(versions)
  if (options.keepVersionsInSync) {
    await Promise.all(
      buildJobs.map((job) =>
        buildHandlers[job.buildPlatform].setBuildVersion(syncVersion, {
          projectPathname: job.compileOptions.projectPath,
          optionsFilename: job.optionsFile,
          optionsVersionKey: job.optionsVersionKey,
        })
      )
    )
  }

  return { build: buildJobs, package: packageJobs, deploy: deployJobs }
}

export const getProjectJobs = async (
  projectKey: string,
  projectConfig: ProjectConfig,
  config: RubberBandConfig,
  options: PrepareBuildsOptions = {}
) => {
  const buildJobs: BuildJobDefinition[] = []
  const packageJobs: PackageJobDefinition[] = []
  const deployJobs: Record<string, DeployJobDefinition> = {}

  const projectPath = dirname(projectConfig.projectFile)
  const projectName = basename(projectConfig.projectFile, extname(projectConfig.projectFile))
  const projectSafeName = projectName.replace(/\s/g, '_')

  let platform: PlatformType
  for (platform in config.platforms) {
    if (options.platforms && !options.platforms.includes(platform)) continue

    const platformConfig = config.platforms[platform]
    const projectPlatformConfig: PlatformConfig = mergeDeep(platformConfig, projectConfig.platforms[platform])

    const platformBuildHandler: BuildHandler = buildHandlers[platform]

    const platformBuildVersion = await platformBuildHandler.getBuildVersion({
      projectPathname: projectConfig.projectFile,
      optionsFilename: platformConfig.optionsFile,
      optionsVersionKey: platformConfig.optionsVersionKey,
      incrementBuild: options.incrementBuild,
    })

    versions.push(parseVersionComponents(platformBuildVersion))

    let architecture: ArchitectureType
    for (architecture in platformConfig.architectures) {
      if (options.architectures && !options.architectures.includes(architecture)) continue

      const architectureConfig = platformConfig.architectures[architecture]

      let deploymentTarget: DeploymentTargetType
      for (deploymentTarget in config.deploymentTargets) {
        if (options.deploymentTargets && !options.deploymentTargets.includes(deploymentTarget)) continue

        const deploymentConfig = config.deploymentTargets[deploymentTarget]
        const projectDeploymentConfig = projectConfig.deploymentTargets[deploymentTarget]

        if (!projectDeploymentConfig.buildConfigs[architecture]) continue

        const buildDeploymentConfig: BuildDeploymentTargetConfig = mergeDeep(deploymentConfig, projectDeploymentConfig)

        const buildConfig: BuildConfig = {
          gmsBuildConfig: projectDeploymentConfig.buildConfigs[architecture],
          platform,
          platformName: platformConfig.name,
          platformBuildVersion,
          projectKey,
          projectName,
          projectSafeName,
          projectPath,
        }

        if (options.actions?.includes('build')) {
          buildJobs.push(
            getBuildJobDefinition({
              buildConfig,
              platformConfig: projectPlatformConfig,
              architectureConfig,
              projectConfig,
              globalConfig: config.global,
              buildPlatformOptions: projectPlatformConfig.moduleConfig,
              deploymentTarget,
              deploymentTargetOptions: buildDeploymentConfig,
            })
          )
        }

        if (options.actions?.includes('package')) {
          packageJobs.push(
            getPackageJobDefinition({
              buildPlatform: platform,
              architectureConfig,
              projectKey,
              projectConfig,
              projectSafeName,
              version: platformBuildVersion,
              deploymentTarget,
              deploymentTargetOptions: buildDeploymentConfig,
              globalConfig: config.global,
            })
          )
        }

        if (options.actions?.includes('deploy')) {
          const deploymentKey = `${projectKey}~${deploymentTarget}`
          if (!deployJobs[deploymentKey]) {
            deployJobs[deploymentKey] = getDeployJobDefinition({
              builds: [],
              deploymentTarget,
              deploymentTargetOptions: buildDeploymentConfig,
              globalConfig: config.global,
              projectKey,
              projectConfig,
            })
          }

          deployJobs[deploymentKey].builds.push(
            getDeployBuildDefinition({
              platform,
              platformName: platformConfig.name,
              version: platformBuildVersion,
              architecture,
              architectureConfig,
              deploymentTarget,
              globalConfig: config.global,
              projectKey,
              projectConfig,
            })
          )
        }
      }
    }
  }

  return { build: buildJobs, package: packageJobs, deploy: Object.values(deployJobs) }
}

export const executeJobs = async (jobs: RubberBandJobs, options?: any) => {
  for (const buildJob of jobs.build) {
    await executeBuildJob(buildJob, options)
  }
  for (const packageJob of jobs.package) {
    await executePackageJob(packageJob)
  }
  for (const deployJob of jobs.deploy) {
    await executeDeployJob(deployJob)
  }
}

export const debugJobs = async (jobs: RubberBandJobs, options?: any) => {
  for (const buildJob of jobs.build) {
    await debugBuildJob(buildJob, options)
  }
  for (const deployJob of jobs.deploy) {
    await debugDeployJob(deployJob)
  }
}

export const getProjectVersion = () => syncVersion
