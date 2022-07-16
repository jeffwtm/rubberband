import { dirname, basename, extname, join } from 'path'
import config_yaml from 'config-yaml'

import { IRubberOptions } from '@incominggames/gamemaker-rubber'

import { mergeDeep } from './utils'
import { Config } from '../types'
import { DeployBase } from './deploy/_base'
import { BuildBase } from './build/_base'

const config: Config = config_yaml(__dirname + '/../config.yml')

export type PrepareBuildsOptions = {
  projects?: string[]
  platforms?: string[]
  architectures?: string[]
  deploymentTargets?: string[]
}

export type BuildDefinition = {
  buildPath: string
  compileOptions: IRubberOptions
  deploymentModule: DeployBase
  deploymentOptions: any
  deploymentPath: string
  logName: string
  module: BuildBase
  moduleOptions: any
  platformName: string
  projectPath: string
  projectName: string
  projectSafeName: string
  projectSafeNameSuffixed: string
  version: string
}

export const prepareBuilds = async (options: PrepareBuildsOptions = {}) => {
  const builds: BuildDefinition[] = []
  const deploymentModules: Record<string, DeployBase> = {}

  for (const project in config.projects) {
    if (options.projects && !options.projects.includes(project)) continue

    const projectConfig = mergeDeep({}, config.global, config.projects[project])

    const projectPath = dirname(projectConfig.projectFile)
    const projectName = basename(projectConfig.projectFile, extname(projectConfig.projectFile))
    const projectSafeName = projectName.replace(/\s/g, '_')

    for (const platform in config.platforms) {
      if (options.platforms && !options.platforms.includes(platform)) continue

      const platformConfig = mergeDeep({}, projectConfig, config.platforms[platform], projectConfig.platforms[platform])
      const platformModule: BuildBase = new (require(platformConfig.module))(platformConfig.moduleConfig)
      const platformBuildVersion = await platformModule.preBuild(mergeDeep({}, platformConfig, options))

      for (const architecture in platformConfig.architectures) {
        if (options.architectures && !options.architectures.includes(architecture)) continue

        const architectureConfig =
          typeof platformConfig.architectures[architecture] === 'object'
            ? platformConfig.architectures[architecture]
            : {}

        for (const deploymentTarget in config.deploymentTargets) {
          if (options.deploymentTargets && !options.deploymentTargets.includes(deploymentTarget)) continue

          const deploymentConfig = mergeDeep(
            {},
            config.deploymentTargets[deploymentTarget],
            projectConfig.deploymentTargets[deploymentTarget]
          )
          if (!deploymentModules[deploymentTarget])
            deploymentModules[deploymentTarget] = new (require(deploymentConfig.module))(deploymentConfig.moduleConfig)

          const buildConfig = mergeDeep(
            {},
            projectConfig,
            platformConfig,
            projectConfig.platforms[platform],
            architectureConfig
          )
          const {
            projectFile,
            tempFolder,
            gamemakerPath,
            buildFolder,
            deviceConfigFileLocation,
            targetDeviceName,
            buildDir,
          } = buildConfig

          if (deploymentConfig.buildConfigs[architecture]) {
            const build: BuildDefinition = {
              buildPath: join(buildDir, buildFolder, platformBuildVersion),
              compileOptions: {
                projectPath: projectFile,
                yyc: true,
                verbose: true,
                config: deploymentConfig.buildConfigs[architecture],
                build: 'zip',
                outputPath: join(
                  buildDir,
                  buildFolder,
                  platformBuildVersion,
                  `${projectSafeName}-${deploymentConfig.buildSuffix}.zip`
                ),
                gamemakerLocation: gamemakerPath,
                tempFolder,
                deviceConfigFileLocation,
                targetDeviceName,
                platform: platform as IRubberOptions['platform'],
              },
              deploymentModule: deploymentModules[deploymentTarget],
              deploymentOptions: deploymentConfig,
              deploymentPath: join(deploymentConfig.buildRoot, buildFolder),
              logName: `${projectSafeName}-${platform}-${deploymentConfig.buildSuffix}`,
              module: platformModule,
              moduleOptions: buildConfig.moduleConfig,
              platformName: platformConfig.name,
              projectPath,
              projectName,
              projectSafeName,
              projectSafeNameSuffixed: `${projectSafeName}-${deploymentConfig.buildSuffix}`,
              version: platformBuildVersion,
            }

            builds.push(build)
          }
        }
      }
    }
  }

  return { builds, deploymentModules }
}
