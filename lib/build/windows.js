const BaseBuild = require('./_base');
const fse = require('fs-extra');
const RJSON = require('relaxed-json');
const { dirname, join } = require("path");

class WindowsBuild extends BaseBuild {
    constructor(options) {
        super(options);
    }
    
    async preBuild(config) {

        const { optionsFile, optionsVersionKey, projectFile, incrementBuild } = config;
        
        const projectPath = dirname(projectFile);
        const optionsFilename = join(projectPath, optionsFile);

        const options_file = await fse.readFile(optionsFilename);
        const options_platform = RJSON.parse(options_file.toString());
        let [major, minor, build, revision] = options_platform[optionsVersionKey].split('.').map(version_number => parseInt(version_number));

        if (incrementBuild) {
            build++;

            const update_version_regex = new RegExp(`(\\"${optionsVersionKey}\\"\\: \\")([0-9\\.]+)(\\")`)
            const updated_options_file = options_file.toString().replace(update_version_regex, `$1${major}.${minor}.${build}.${revision}$3`);
            await fse.writeFile(optionsFilename, updated_options_file);
        }

        this.version = `${major}.${minor}.${build}.${revision}`;

        return this.version;
        
    }
    
}

module.exports = WindowsBuild;