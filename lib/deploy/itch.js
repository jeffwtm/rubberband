const DeployBase = require('./_base');
const { spawn } = require("child_process");
const { dirname, basename, extname, join } = require("path");

class Itch extends DeployBase {
    constructor(config) {
        super(config);
    }

    async deploy(builds) {
        
        //butler push directory user/game:channel
        const { account, gameid } = this.config;

        for (const build of builds) {
            if (build.deploymentModule !== this)
                continue;

            const platformConfig = Object.assign({}, this.config.platforms[build.compileOptions.platform]);
            const { channel } = platformConfig;
            
            await new Promise((resolve, reject) => {
                const butlerArgs = ['push', build.deploymentPath, `${account}/${gameid}:${channel}`, '--userversion', build.version];
                console.log('butler', butlerArgs.join(' '));
                // return resolve();
            
                const butler = spawn('butler', butlerArgs);
                butler.stdout.on('data', (data) => console.log(data.toString()));
                butler.stderr.on('data', (data) => console.log(data.toString()));
                butler.on('close', async(code) => {
                    resolve();
                });
            });
        }
    }
}

module.exports = Itch;