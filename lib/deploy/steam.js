const DeployBase = require('./_base');
const { spawn } = require("child_process");
const { dirname, basename, extname, join } = require("path");
const fse = require('fs-extra');
const vdf = require('node-vdf');

class Steam extends DeployBase {
    constructor(config) {
        super(config);
    }

    async deploy(builds) {

        const { contentBuilderRoot, username, password, appid } = this.config;
        const buildVersions = builds.map(build => build.platformName + ': ' + build.version).filter((value, index, self) => self.indexOf(value) === index);

        const app_vdf_file = join(contentBuilderRoot, 'scripts', `app_build_${appid}.vdf`);
        const app_vdf = vdf.parse(String(await fse.readFile(app_vdf_file)));
        app_vdf.appbuild.desc = `Automatic build (${buildVersions.join(', ')})`;
        await fse.writeFile(app_vdf_file, vdf.dump(app_vdf));
        console.log(app_vdf);
        
        await new Promise((resolve, reject) => {
            
            const steamArgs = ['+login', username, password, '+run_app_build_http', app_vdf_file, '+quit'];
            console.log('steamcmd.exe', steamArgs.join(' '));
            // return resolve();
            
            const steam = spawn(join(this.config.contentBuilderRoot, "builder", "steamcmd.exe"), steamArgs);
            steam.stdout.on('data', (data) => console.log(data.toString()));
            steam.stderr.on('data', (data) => console.log(data.toString()));
            steam.on('close', async(code) => {
                resolve();
            });

        });
    }
}

module.exports = Steam;