const { dirname, basename, extname, join } = require("path");
const config_yaml = require('config-yaml');
const { mergeDeep } = require('./utils');

const config = config_yaml(__dirname + '/../config.yml');

exports.prepareBuilds = async (options) => {

    const builds = [];
        
    for (const project in config.projects) {
        if (options.projects && !options.projects.includes(project))
            continue;

        const projectConfig = mergeDeep({}, config.global, config.projects[project]);
        
        const projectPath = dirname(projectConfig.projectFile);
        const projectName = basename(projectConfig.projectFile, extname(projectConfig.projectFile))
        const projectSafeName = projectName.replace(/\s/g, '_');

        for (const platform in config.platforms) {
            if (options.platforms && !options.platforms.includes(platform))
                continue;

            const platformConfig = mergeDeep({}, projectConfig, config.platforms[platform], projectConfig.platforms[platform]);
            const platformModule = new (require(platformConfig.module))(platformConfig.moduleConfig);
            const platformBuildVersion = await platformModule.preBuild(mergeDeep({}, platformConfig, options));

            for (const architecture in platformConfig.architectures) {
                if (options.architectures && !options.architectures.includes(architecture))
                    continue;

                const architectureConfig = typeof platformConfig.architectures[architecture] === 'object' ? platformConfig.architectures[architecture] : {};

                for (const deploymentTarget in config.deploymentTargets) {
                    if (options.deploymentTargets && !options.deploymentTargets.includes(deploymentTarget))
                        continue;

                    const deploymentConfig = mergeDeep({}, config.deploymentTargets[deploymentTarget], projectConfig.deploymentTargets[deploymentTarget]);
                    const deploymentModule = new (require(deploymentConfig.module))(deploymentConfig.moduleConfig);

                    const buildConfig = mergeDeep({}, projectConfig, platformConfig, projectConfig.platforms[platform], architectureConfig);
                    const { projectFile, tempFolder, gamemakerPath, buildFolder, deviceConfigFileLocation, targetDeviceName, buildDir } = buildConfig;
                    
                    if (deploymentConfig.buildConfigs[architecture]) {
                        const build = {
                            buildPath: join(buildDir, buildFolder, platformBuildVersion),
                            compileOptions: {
                                projectPath: projectFile,
                                yyc: true,
                                verbose: true,
                                config: deploymentConfig.buildConfigs[architecture],
                                build: 'zip',
                                outputPath: join(buildDir, buildFolder, platformBuildVersion, `${projectSafeName}-${deploymentConfig.buildSuffix}.zip`),
                                gamemakerLocation: gamemakerPath,
                                tempFolder,
                                deviceConfigFileLocation,
                                targetDeviceName,
                                platform
                            },
                            deploymentModule,
                            deploymentOptions: deploymentConfig,
                            deploymentPath: join(deploymentConfig.buildRoot, buildFolder),
                            module: platformModule,
                            moduleOptions: buildConfig.moduleConfig,
                            projectPath,
                            projectName,
                            projectSafeName,
                            projectSafeNameSuffixed: `${projectSafeName}-${deploymentConfig.buildSuffix}`,
                            version: platformBuildVersion
                        }

                        builds.push(build);
                    }
                }
            }
        }

    }

    return builds;

}
