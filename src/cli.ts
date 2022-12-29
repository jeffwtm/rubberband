#!/usr/bin/env node

import inquirer from 'inquirer'
import chalk from 'chalk'
import figlet from 'figlet'
import fse from 'fs-extra'
import { program } from 'commander'
import config_yaml from 'config-yaml'
import { join } from 'path'

// import { prepareBuilds } from './build'
import { CLIArguments, RubberBandConfig, PrepareBuildsOptions } from './types'
import { debugJobs, executeBuildJob, executeDeployJob, executePackageJob, prepareJobs } from './utils'

let args: CLIArguments = {}

program.version('0.0.1')
program.option('-s, --skip-building', 'only perform pre & post build tasks during build step', false)
program.option('--config <file.yml>', 'configuration file', 'config.yml')
program.option('--options <file.yml>', 'build options file. if not provided will prompt for selections')
program.option('--check-config', 'output job definitions ONLY, do not execute jobs', false)
program.option('--debug', 'output debug info', false)

program.parse(process.argv)
args = program.opts()

const configFile = args.config ?? 'config.yml'
// console.log('config file:', configFile)
const configPath = join(process.cwd(), configFile)
// console.log('config path:', configPath)
const config: RubberBandConfig = config_yaml(configPath)
let options: PrepareBuildsOptions = {}
let _stdout: any, _stderr: any

const init = () => {
  console.log('--')
  console.log('-----')
  console.log('--------')
  console.log('Welcome to')
  console.log(
    chalk.red(
      figlet.textSync('Rubber Band', {
        font: 'Big',
        horizontalLayout: 'default',
        verticalLayout: 'default',
      })
    )
  )

  if (args.skipBuilding) console.log('Skip building enabled.')
  if (args.config) console.log(`Using config file ${args.config}`)
  if (args.options) console.log(`Using options file ${args.options}`)
}

const prepareQuestions = () => {
  return [
    {
      name: 'projects',
      type: 'checkbox',
      message: 'Which project(s) are we using?',
      choices: Object.entries(config.projects).map(([key, project]) => ({
        name: project.name,
        value: key,
        checked: Object.entries(config.projects).length == 1,
      })),
      validate: (answer: any) => !!answer.length,
    },
    {
      name: 'actions',
      type: 'checkbox',
      message: 'What are we doing?',
      choices: [
        { name: 'Build', value: 'build', checked: true },
        { name: 'Package', value: 'package', checked: true },
        { name: 'Deploy', value: 'deploy', checked: true },
      ],
      validate: (answer: any) => !!answer.length,
    },
    {
      name: 'incrementBuild',
      type: 'confirm',
      message: 'Should we increment the build number?',
      default: true,
      when: (answers: any) => answers.actions.includes('build'),
    },
    {
      name: 'platforms',
      type: 'checkbox',
      // message: (answers) => `Which platform(s) should we ${answers.actions.join(' and ')} ${answers.actions.includes('deploy') ? 'to' : 'for'}?`,
      message: 'Which platform(s) should we build for?',
      choices: Object.entries(config.platforms).map(([key, platform]) => ({
        name: platform.name,
        value: key,
        checked: true,
      })),
      validate: (answer: any) => !!answer.length,
      when: (answers: any) => answers.actions.includes('build'),
    },
    {
      name: 'architectures',
      type: 'checkbox',
      message: 'Which architecture(s) should we build?',
      choices: (answers: any) =>
        Object.entries(
          Object.entries(config.platforms)
            .filter(([key]) => answers.platforms.includes(key))
            .reduce(
              (architectures, [_key, platform]) =>
                Object.assign(architectures, platform.architectures as Record<string, unknown>),
              {}
            )
        ).map(([key]) => ({ name: key, value: key, checked: true })),
      validate: (answer: any) => !!answer.length,
      when: (answers: any) => answers.actions.includes('build'),
    },
    {
      name: 'deploymentTargets',
      type: 'checkbox',
      message: (answers: any) =>
        answers.actions.includes('deploy') ? 'Where should we deploy?' : 'What deployment targets should we build for?',
      choices: Object.entries(config.deploymentTargets).map(([key, deploymentTarget]) => ({
        name: deploymentTarget.name,
        value: key,
        checked: true,
      })),
      validate: (answer: any) => !!answer.length,
    },
  ]
}

const startLogging = (file: string) => {
  const log = fse.createWriteStream(file)
  _stdout = process.stdout.write
  _stdout = process.stderr.write
  //@ts-ignore
  process.stdout.write = process.stderr.write = log.write.bind(log)
  process.on('uncaughtException', function (err) {
    finishLogging()
    console.error(err && err.stack ? err.stack : err)
  })
}

const finishLogging = () => {
  process.stdout.write = _stdout
  process.stderr.write = _stderr
}

const run = async () => {
  init()

  const { skipBuilding, checkConfig, debug } = args

  if (args.options) {
    options = config_yaml(join(process.cwd(), args.options))
  } else {
    const prompts = prepareQuestions()
    options = await inquirer.prompt(prompts)
  }

  console.log()
  console.log()

  console.log('Flexing...')
  const jobs = await prepareJobs(config, options)
  // const { builds, deploymentModules } = await prepareBuilds(config, options)
  // console.log(builds);
  console.log('Done.')
  console.log()

  if (checkConfig || debug) {
    if (checkConfig) console.log(JSON.stringify(jobs, undefined, 2))
    if (debug) await debugJobs(jobs)
    return
  }

  if (options.actions?.includes('build')) {
    console.time('build')

    console.log('Stretching...')
    for (const buildJob of jobs.build) {
      // startLogging(__dirname + `/log/${build.compileOptions.platform}.log`);
      // console.log(build.module);
      await executeBuildJob(buildJob, { skipBuilding })
      // finishLogging();
    }

    console.timeEnd('build')
  }

  if (options.actions?.includes('package')) {
    console.time('package')

    console.log('Aiming...')
    for (const packageJob of jobs.package) {
      await executePackageJob(packageJob)
    }

    console.timeEnd('package')
  }

  if (options.actions?.includes('deploy')) {
    console.time('deploy')

    console.log('Releasing...')
    for (const deployJob of jobs.deploy) {
      await executeDeployJob(deployJob)
    }

    console.timeEnd('deploy')
  }
}

run()
