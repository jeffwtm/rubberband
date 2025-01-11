export type GMSOptions = Record<string, string>

export type GMSProjectVersion = `${number}.${number}.${number}` | `${number}.${number}.${number}.${number}`

export type GMSDevice = {
  displayname: string
  hostname: string
  username: string
  encrypted_password: string
  install_dir: string
  runtime?: string
}

export type GMSDevices = Record<string, Record<string, GMSDevice>>
