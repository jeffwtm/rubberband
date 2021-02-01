const BaseBuild = require('./_base');
const { signAndNotarize } = require('../macOsNotarize');
const fse = require('fs-extra');
const { Shell } = require('../shell');
const { join } = require("path");
const { exec } = require('child_process');

class MacBuild extends BaseBuild {
    constructor(options) {
        super(options);
    }

    async build(config, skipBuilding) {

        const localOutputPath = config.buildPath;
        config.compileOptions.outputPath = join(localOutputPath, `${config.projectSafeNameSuffixed}-unsigned.zip`);
        
        const { host, username, password, buildPath, appleUser, applePassword, providerShortName, signingCertificate, bundleid } = this.options;
        const sshConfig = {
            host,
            username,
            password
        };
        const sh = new Shell(sshConfig, true);
        let success = false;

        try {
            await sh.connect();
            await sh.exec('nohup caffeinate &>/dev/null </dev/null &');

            if (!skipBuilding)
                await super.build(config);
            
            await fse.mkdirs(localOutputPath);

            success = await signAndNotarize({ 
                sh,
                password,
                buildPath, 
                gamemakerPath: this.gmsPlatformOptions.option_mac_output_dir,
                appSource: config.projectSafeName,
                appDest: config.deploymentOptions.alwaysUseSafeName ? config.projectSafeName : config.projectName,
                appNotarized: config.projectSafeNameSuffixed,
                appleUser, 
                applePassword, 
                providerShortName, 
                signingCertificate, 
                bundleid,
                localOutputPath,
                useEntitlements: config.deploymentOptions.requiresEntitlements
            });
        }
        catch (e) {
            console.log('Error:', String(e));
        }
        finally {
            await sh.exec('pkill -KILL caffeinate');
            await sh.close();
        }

        return success;

    }

    async package(config) {
        await super.package(config);
        
        const { deploymentPath } = config;
        await fse.remove(join(deploymentPath, '__MACOSX'));
    }
}

module.exports = MacBuild;