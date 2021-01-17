const BaseBuild = require('./_base');
const { signAndNotarize } = require('../macOsNotarize');
const fse = require('fs-extra');
const RJSON = require('relaxed-json');
const { join } = require("path");

class MacBuild extends BaseBuild {
    constructor(options) {
        super(options);
    }

    async build(config, skipBuilding) {

        const localOutputPath = config.buildPath;
        config.compileOptions.outputPath = join(localOutputPath, `${config.projectSafeNameSuffixed}-unsigned.zip`);
        
        if (!skipBuilding)
            await super.build(config);
        
        const { host, username, password, buildPath, appleUser, applePassword, providerShortName, signingCertificate, bundleid } = this.options;
        const sshconfig = {
            host,
            username,
            password
        };

        try {

            await fse.mkdirs(localOutputPath);

            return await signAndNotarize({ 
                ...sshconfig,
                buildPath, 
                gamemakerPath: this.gmsPlatformOptions.option_mac_output_dir,
                appSource: config.projectSafeName,
                appDest: config.projectName,
                appNotarized: config.projectSafeNameSuffixed,
                appleUser, 
                applePassword, 
                providerShortName, 
                signingCertificate, 
                bundleid,
                localOutputPath
            })
        }
        catch (e) {
            console.log('Error:', String(e));
        }

    }

    async package(config) {
        await super.package(config);
        
        const { deploymentPath } = config;
        await fse.remove(join(deploymentPath, '__MACOSX'));
    }
}

module.exports = MacBuild;