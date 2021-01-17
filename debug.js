const { Shell } = require('./lib/shell');
const config_yaml = require('config-yaml');
const client = require('scp2');
const { join } = require("path");
const { prepareBuilds } = require('./lib/build');

const config = config_yaml(__dirname + '/config.yml');
const { host, username, password } = config.platforms.mac;

const scpConfig = {
    host,
    username,
    password,
    path: `/Users/jeffsmith/Projects/incominggames/build/steam_build.entitlements`
};

console.log(scpConfig);

(async () => {

    // const sh = new Shell({
    //     host, username, password
    // }, true);
    
    // try {
    //     await sh.connect();

    // }
    // finally {
    //     await sh.close();
    // }

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

})();