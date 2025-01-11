import { join } from 'path'
import fse from 'fs-extra'
import plist from 'plist'
import { GMSDevices, GMSProjectVersion, VersionComponents } from '../types'

let gamemakerUserFolder: string
let gamemakerLicense: plist.PlistValue
let gamemakerDevices: GMSDevices

export async function getUserDir() {
  const userFolder = await getUserFolder()
  return join(`${process.env.APPDATA}`, 'GameMakerStudio2', userFolder)
}

const getUserFolder = async () => {
  if (!gamemakerUserFolder) {
    // The UM file contains the user's id number.
    const um = JSON.parse((await fse.readFile(`${process.env.APPDATA}\\GameMakerStudio2\\um.json`)).toString())
    gamemakerUserFolder =
      (um.username.includes('@') ? um.username.substring(0, um.username.indexOf('@')) : um.username) + '_' + um.userID
  }
  return gamemakerUserFolder
}

export const getLicense = async () => {
  if (!gamemakerLicense) {
    const userDir = await getUserDir()
    const licensePlist = await fse.readFile(join(userDir, 'licence.plist'), 'utf8')
    gamemakerLicense = plist.parse(licensePlist)
  }
  return gamemakerLicense
}

export const getDevices = async () => {
  if (!gamemakerDevices) {
    const userDir = await getUserDir()
    const devicesFile = await fse.readFile(join(userDir, 'devices.json'), 'utf8')
    gamemakerDevices = JSON.parse(devicesFile)
  }
  return gamemakerDevices
}

export const componentsToGMSVersion = (components: VersionComponents): GMSProjectVersion => {
  const { major, minor, build } = components
  return `${major}.${minor}.${build}`
}
