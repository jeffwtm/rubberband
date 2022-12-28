import SSH2Promise from 'ssh2-promise'
import client from 'scp2'
import { EventEmitter } from 'events'

export type ShellConfig = {
  host: string
  username: string
  password: string
}

export class Shell {
  config: ShellConfig
  debug: boolean
  emitter: EventEmitter
  ssh: SSH2Promise
  connect: () => Promise<void>
  exec: (command: string) => Promise<string>
  spawn: (command: string) => Promise<string[]>
  download: (remoteFile: string, localFile: string) => Promise<void>
  upload: (localFile: string, remoteFile: string) => Promise<void>
  close: () => Promise<any[]>
  on: InstanceType<typeof EventEmitter>['on']

  constructor(config: ShellConfig, debug: boolean) {
    this.config = config
    this.debug = debug
    this.emitter = new EventEmitter()
    this.emitter.on('output', (data) => console.log(data))

    this.ssh = new SSH2Promise(config)
    this.ssh.on('ssh', (status) => {
      if (status == 'beforeconnect') {
        this.emitter.emit('output', 'Attempting to connect...')
      }
    })

    this.connect = async () => {
      await this.ssh.connect()
      this.emitter.emit('output', 'Connection established')
    }
    this.exec = async (command) => {
      if (this.debug) this.emitter.emit('output', command)
      const output = String(await this.ssh.exec(command))
        .split('\n')
        .join(' ')
        .trim()
      this.emitter.emit('output', output)
      return output
    }
    this.spawn = async (command) => {
      if (this.debug) this.emitter.emit('output', command)
      return await new Promise((resolve, reject) => {
        let output: string[] = []
        this.ssh.spawn(command).then((stream) => {
          stream
            .on('data', (data: any) => {
              Array.prototype.push.apply(output, String(data).split('\n'))
              this.emitter.emit('output', String(data))
            })
            .on('close', () => resolve(output))
            .on('finish', () => resolve(output))
            .stderr.on('data', (data: any) => {
              Array.prototype.push.apply(output, String(data).split('\n'))
              this.emitter.emit('output', String(data))
            })
        })
      })
    }
    this.download = async (remoteFile, localFile) => {
      if (this.debug)
        this.emitter.emit('output', `Transferring remote file "${remoteFile}" to local file "${localFile}"...`)
      await new Promise<void>((resolve) => {
        client.scp({ ...this.config, path: remoteFile }, localFile, (err: any) => {
          if (err) this.emitter.emit('output', err)
          else this.emitter.emit('output', 'Completed successfully.')
          resolve()
        })
      })
    }
    this.upload = async (localFile, remoteFile) => {
      if (this.debug)
        this.emitter.emit('output', `Transferring local file "${localFile}" to remote file "${remoteFile}"...`)
      await new Promise<void>((resolve) => {
        client.scp(localFile, { ...this.config, path: remoteFile }, (err) => {
          if (err) this.emitter.emit('output', err)
          else this.emitter.emit('output', 'Completed successfully.')
          resolve()
        })
      })
    }
    this.close = async () => await this.ssh.close()

    this.on = this.emitter.on
  }
}
