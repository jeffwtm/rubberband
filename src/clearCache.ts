import rubber from '@incominggames/gamemaker-rubber'
import config_yaml from 'config-yaml'
import { Config } from './types'

const config: Config = config_yaml(__dirname + '/config.yml')

;(async function () {
  for (const project in config.projects) {
    const projectConfig = config.projects[project]
    await rubber.clearCache(projectConfig.projectFile)
    console.log('Cache cleared.')
  }
})()
