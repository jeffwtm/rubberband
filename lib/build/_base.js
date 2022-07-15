const rubber = require('@incominggames/gamemaker-rubber');
const fse = require('fs-extra');
const RJSON = require('relaxed-json');
const AdmZip = require('adm-zip');
const { dirname, join } = require("path");

class BuildBase {
    constructor(options) {
        this.options = options;
        this.logStream = false;
        this.logData = this.logData.bind(this);
    }

    logData(data) {
        const output = data.toString().trim();
        console.log(output);
        if (output && this.logStream)
            this.logStream.write(output + "\n");
    }

    async preBuild(config) {

        const { optionsFile, optionsVersionKey, projectFile, incrementBuild } = config;
        
        const projectPath = dirname(projectFile);
        const optionsFilename = join(projectPath, optionsFile);

        const options_file = await fse.readFile(optionsFilename);
        const options_platform = RJSON.parse(options_file.toString());
        let [major, minor, build] = options_platform[optionsVersionKey].split('.').map(version_number => parseInt(version_number));

        if (incrementBuild) {
            build++;

            const update_version_regex = new RegExp(`(\\"${optionsVersionKey}\\"\\: \\")([0-9\\.]+)(\\")`)
            const updated_options_file = options_file.toString().replace(update_version_regex, `$1${major}.${minor}.${build}$3`);
            await fse.writeFile(optionsFilename, updated_options_file);
        }

        this.version = `${major}.${minor}.${build}`;
        this.gmsPlatformOptions = options_platform;

        return this.version;
        
    }
    
    async build(config) {

        this.logStream = fse.createWriteStream(__dirname + '/../../log/' + config.logName + '.log');
        
        await fse.mkdirs(config.buildPath);

        await new Promise((resolve, reject) => {

            const execution = rubber.compile(config.compileOptions, false);
            execution.on("compileStatus", this.logData);
            execution.on("gameStatus", this.logData);
            execution.on("allFinished", async (errors) => {

                if (errors.length) {
                    console.log(errors);
                    return reject(errors);
                }

                resolve();

            });
                
        });
  
    }

    async package(config) {

        const { deploymentPath, buildPath, projectSafeNameSuffixed } = config;
        const zip = new AdmZip(join(buildPath, projectSafeNameSuffixed + '.zip'));
        await fse.emptyDir(deploymentPath);
        zip.extractAllTo(deploymentPath);
    
    }
}

module.exports = BuildBase;