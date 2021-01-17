const { Shell } = require('./shell');
const client = require('scp2');
const axios = require('axios');
const { join } = require("path");
const { parseCliResponseObject } = require('./utils');

exports.signAndNotarize = async (options) => {
    const { host, username, password, buildPath, gamemakerPath, appSource, appDest, appNotarized, appleUser, applePassword, providerShortName, signingCertificate, bundleid, localOutputPath, useEntitlements } = options;
    const sshConfig = { host, username, password };
    const NotarizationStatus = {
        Pending: 1,
        Failed: 2,
        Succeeded: 3
    }

    const checkNotarizationStatus = async (requestid) => {
        const response = await sh.spawn(`xcrun altool --notarization-info ${requestid} --username ${appleUser} --password ${applePassword} --asc-provider ${providerShortName}`);
        const fields = ['LogFileURL', 'Status', 'Status Code', 'Status Message'];
        const status = parseCliResponseObject(response, fields);

        // console.log(status);

        if (status.LogFileURL) {
            const log = await axios.get(status.LogFileURL);
            const logFile = log.data;
            console.log(logFile);

            if (logFile.issues) {
                //do something if there are warnings
            }
        }

        if (status.Status == 'success' && status.StatusCode == '0')
            return NotarizationStatus.Succeeded;
        else if (status.Status == 'invalid' && status.StatusCode == '2')
            return NotarizationStatus.Failed;
        else
            return NotarizationStatus.Pending;
    }

    const stapleNotarizedApp = async () => {
        await sh.spawn(`xcrun stapler staple "${buildPath}/signed/${appDest}.app"`);
        await sh.spawn(`spctl -a -v "${buildPath}/signed/${appDest}.app"`);
    }

    const zipAndTransfer = async () => {
        await sh.exec(`mkdir -p "${buildPath}/notarized/"`);
        await sh.exec(`rm -rf "${buildPath}/notarized/${appNotarized}.zip"`);
        await sh.exec(`ditto -c -k --sequesterRsrc --keepParent "${buildPath}/signed/${appDest}.app" "${buildPath}/notarized/${appNotarized}.zip"`);

        const scpConfig = {
            ...sshConfig,
            path: `${buildPath}/notarized/${appNotarized}.zip`
        };

        await new Promise((resolve) => {
            client.scp(scpConfig, join(localOutputPath, `${appNotarized}.zip`), (err) => {
                if (err)
                    console.log(err);
                else
                    console.log('Completed successfully.');
                resolve();
            })
        })
    }

    const codesignApp = async (useEntitlements) => {
        await sh.exec(`chmod -R a+xr "${buildPath}/signed/${appDest}.app"`);
        if (useEntitlements)
            await sh.exec(`plutil "${buildPath}/steam_build.entitlements"`);
        await sh.exec(`security unlock-keychain -p "${password}" && security find-certificate -c '${signingCertificate}'`);
        await sh.spawn(`security unlock-keychain -p "${password}"; codesign --deep --force --verify --verbose --timestamp --options runtime `
                    + (useEntitlements ? `--entitlements "${buildPath}/steam_build.entitlements" ` : '')
                    + `--sign "${signingCertificate}" "${buildPath}/signed/${appDest}.app"`);
        await sh.spawn(`codesign --display --verbose "${buildPath}/signed/${appDest}.app"`);
        await sh.exec(`rm -rf "${buildPath}/signed/${appDest}.zip"`);
        await sh.exec(`ditto -c -k --sequesterRsrc --keepParent "${buildPath}/signed/${appDest}.app" "${buildPath}/signed/${appDest}.zip"`);
        await sh.exec(`ls -lh "${buildPath}/signed/"`);
    }

    const notarizeApp = async () => {
        const notarizationResult = await sh.spawn(
            `xcrun altool --notarize-app --username ${appleUser} --password ${applePassword} --asc-provider ${providerShortName} --primary-bundle-id ${bundleid} --file "${buildPath}/signed/${appDest}.zip"`);
        const requestid = parseCliResponseObject(notarizationResult, ['RequestUUID']).RequestUUID;

        console.log(`Waiting for notarization (${requestid})...`);
        
        let notarizationStatus = NotarizationStatus.Pending;
        return await new Promise(async (resolve, reject) => {
            while (notarizationStatus == NotarizationStatus.Pending) {
                await new Promise(async (resolve) => {
                    setTimeout(async () => {
                        notarizationStatus = await checkNotarizationStatus(requestid);
                        resolve();
                    }, 1000 * 60);
                })
            }
            if (notarizationStatus == NotarizationStatus.Succeeded)
                resolve(true);
            else
                reject(false);
        });
    }

    const prepareApp = async (user) => {
        await sh.exec(`rm -rf "${buildPath}/signed/${appDest}.app"`);
        await sh.exec(`cp -r "${gamemakerPath.replace('~/', `/Users/${user}/`)}/GMS2MAC/${appSource}/${appSource}.app" "${buildPath}/signed/${appDest}.app"`);
    }

    const fixSplashScreen = async () => {
        await sh.exec(`cp -f "${buildPath}/../splash.png" "${buildPath}/signed/${appDest}.app/Contents/Resources/splash.png"`);
    }

    let success = false;
    const sh = new Shell(sshConfig, true);
    
    try {
        await sh.connect();
        const user = await sh.exec("whoami");
        
        await prepareApp(user);
        await fixSplashScreen();
        await codesignApp(useEntitlements);
        success = await notarizeApp();
        success = true;

        if (success) {
            await stapleNotarizedApp();
            await zipAndTransfer();
        }
    }
    finally {
        await sh.close();
    }

    return success;
};