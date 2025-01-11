import { isAbsolute, join } from 'path'
import { GMSProjectVersion, VersionComponents } from '../types'
import { componentsToGMSVersion } from './gamemaker'

export const parseCliResponseObject = (response: string[], fields: string[]) => {
  return response
    .filter((l) => fields.some((f) => l.includes(f + ': ') || l.includes(f + ' = ')))
    .map((l) => {
      const obj: any = {}
      fields.forEach((f) => {
        const propname = f.replace(' ', '')
        if (l.includes(f + ': ')) {
          obj[propname] = l.split(f + ': ')[1]
        } else if (l.includes(f + ' = ')) {
          obj[propname] = l.split(f + ' = ')[1]
        }
      })
      return obj
    })
    .reduce((a, b) => Object.assign(a, b), {})
}

/**
 * Simple object check.
 * @param item
 * @returns {boolean}
 */
export const isObject = function (item: unknown): item is Record<string, unknown> {
  return !!item && typeof item === 'object' && !Array.isArray(item)
}

/**
 * Deep merge two objects.
 * @param target
 * @param ...sources
 */
export const mergeDeep = function <T1 extends Record<string, unknown>, T2, T3, T4>(
  target: T1,
  ...sources: Array<T2 | T3 | T4>
): T1 & T2 & T3 & T4 {
  return mergeDeepInner({}, target, ...sources)
}

const mergeDeepInner = function <T1 extends Record<string, unknown>, T2, T3, T4>(target: T1, ...sources: any): any {
  if (!sources.length) return target
  const source = sources.shift()

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} })
        mergeDeepInner(target[key] as Record<string, unknown>, source[key])
      } else {
        Object.assign(target, { [key]: source[key] })
      }
    }
  }

  return mergeDeepInner(target, ...sources) as T1 & T2 & T3 & T4
}

export const getAbsolutePath = (path: string) => (isAbsolute(path) ? path : join(process.cwd(), path))

export const xorString = (message: string, salt: string) => {
  const result = []
  for (let i = 0; i < message.length; i++) {
    result.push(message.charCodeAt(i) ^ salt.charCodeAt(i % salt.length))
  }
  return String.fromCharCode(...result)
}
export const xorString2 = (message: string, salt: string) => {
  const result = []
  for (let i = 0; i < message.length; i++) {
    const charCode = message.charCodeAt(i)
    // Check if the character is uppercase or lowercase
    const isUpper = charCode >= 65 && charCode <= 90
    const xorCharCode = (isUpper ? charCode | 32 : charCode) ^ salt.charCodeAt(i % salt.length)
    result.push(isUpper ? xorCharCode & 95 : xorCharCode)
  }
  return String.fromCharCode(...result)
}

export const decrypt = (encryptedString: string, key: string) => {
  const salt = Buffer.from(key).toString('hex')
  return xorString(Buffer.from(encryptedString, 'base64').toString(), salt)
}

export const parseVersionComponents = (version: string): VersionComponents => {
  const [major, minor, build] = version.split('.').map((versionNumber) => parseInt(versionNumber))
  return { major, minor, build }
}

export const getHighestVersion = (versions: VersionComponents[]): GMSProjectVersion => {
  let version: VersionComponents = {
    major: 0,
    minor: 0,
    build: 0,
  }
  versions.forEach((v) => {
    if (v.major > version.major) version = v
    else if (v.minor > version.minor) version = v
    else if (v.build > version.build) version = v
  })
  return componentsToGMSVersion(version)
}
