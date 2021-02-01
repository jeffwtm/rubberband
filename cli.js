const inquirer = require("inquirer");
const chalk = require("chalk");
const figlet = require("figlet");
const fse = require('fs-extra');
const { program } = require('commander');
const config_yaml = require('config-yaml');
const { prepareBuilds } = require("./lib/build");

program.version('0.0.1');
const config = config_yaml(__dirname + '/config.yml');
let args = {};
let _stdout, _stderr;

const init = () => {
    program
        .option('-s, --skip-building', 'only perform pre & post build tasks during build step');

    program.parse(process.argv);
    args = program.opts();
    
    console.log("--")
    console.log("-----")
    console.log("--------")
    console.log("Welcome to")
    console.log(
      chalk.red(
        figlet.textSync("Rubber Band", {
          font: "Big",
          horizontalLayout: "default",
          verticalLayout: "default"
        })
      )
    );

    if (args.skipBuilding)
        console.log('Skip building enabled.');
}

const prepareQuestions = () => {
    return [
        {
            name: 'projects',
            type: 'checkbox',
            message: 'Which project(s) are we using?',
            choices: Object.entries(config.projects).map(([key, project]) => ({ name: project.name, value: key, checked: Object.entries(config.projects).length == 1 })),
            validate: (answer) => !!answer.length
        },
        {
            name: 'actions',
            type: 'checkbox',
            message: 'What are we doing?',
            choices: [{ name: 'Build', value: 'build', checked: true }, { name: 'Package', value: 'package', checked: true }, { name: 'Deploy', value: 'deploy', checked: true }],
            validate: (answer) => !!answer.length
        },
        {
            name: 'incrementBuild',
            type: 'confirm',
            message: 'Should we increment the build number?',
            default: true,
            when: (answers) => answers.actions.includes('build')
        },
        {
            name: 'platforms',
            type: 'checkbox',
            // message: (answers) => `Which platform(s) should we ${answers.actions.join(' and ')} ${answers.actions.includes('deploy') ? 'to' : 'for'}?`,
            message: 'Which platform(s) should we build for?',
            choices: Object.entries(config.platforms).map(([key, platform]) => ({ name: platform.name, value: key, checked: true })),
            validate: (answer) => !!answer.length,
            when: (answers) => answers.actions.includes('build')
        },
        {
            name: 'architectures',
            type: 'checkbox',
            message: 'Which architecture(s) should we build?',
            choices: (answers) => 
                Object.entries(
                    Object.entries(config.platforms)
                    .filter(([key]) => answers.platforms.includes(key))
                    .reduce((architectures, [key, platform]) => Object.assign(architectures, platform.architectures), {})
                )
                .map(([key]) => ({ name: key, value: key, checked: true })),
            validate: (answer) => !!answer.length,
            when: (answers) => answers.actions.includes('build')
        },
        {
            name: 'deploymentTargets',
            type: 'checkbox',
            message: (answers) => answers.actions.includes('deploy') ? 'Where should we deploy?' : 'What deployment targets should we build for?',
            choices: Object.entries(config.deploymentTargets).map(([key, deploymentTarget]) => ({ name: deploymentTarget.name, value: key, checked: true })),
            validate: (answer) => !!answer.length
        },
    ];
}

const startLogging = (file) => {
    const log = fse.createWriteStream(file);
    _stdout = process.stdout.write;
    _stdout = process.stderr.write;
    process.stdout.write = process.stderr.write = log.write.bind(log);
    process.on('uncaughtException', function(err) {
        finishLogging();
        console.error((err && err.stack) ? err.stack : err);
    });
}

const finishLogging = () => {
    process.stdout.write = _stdout;
    process.stderr.write = _stderr;
}

const run = async () => {
    init();

    const {skipBuilding} = args;

    const prompts = prepareQuestions();
    const options = await inquirer.prompt(prompts);
    console.log();
    console.log();

    console.log('Flexing...');
    const { builds, deploymentModules } = await prepareBuilds(options);
    // console.log(builds);
    console.log('Done.');
    console.log();

    if (options.actions.includes('build')) {
        console.time('build')
    
        console.log('Stretching...');
        for (const build of builds) {
            startLogging(__dirname + `/log/${build.compileOptions.platform}.log`);
            console.log(build.module);
            await build.module.build(build, skipBuilding);
            finishLogging();
        }

        console.timeEnd('build');
    }

    if (options.actions.includes('package')) {
        console.time('package');

        console.log('Aiming...');
        for (const build of builds) {
            await build.module.package(build);
        }
        
        console.timeEnd('package');
    }
    
    if (options.actions.includes('deploy')) {
        console.time('deploy');

        console.log('Releasing...');
        for (const deploymentModule in deploymentModules)
        await deploymentModules[deploymentModule].deploy(builds);
        
        console.timeEnd('deploy');
    }
};
  
run();