declare module 'scp2' {
  interface ScpOptions {
    port?: number
    host?: string
    username?: string
    password?: string
    paths?: string
    path?: string
  }

  interface attrs {
    size: number
    uid: number
    gid: number
    mode: number | string
    atime: number
    mtime: number
  }

  interface writeOptions {
    destination: string
    content: string
    attrs: attrs
    source: string
  }

  export class Client {
    constructor(options: ScpOptions)
    sftp(callback: (err: string, sftp: Client) => void): void
    close(): void
    mkdir(dir: string, attrs: attrs, callback: (err: string) => void): void
    write(options: writeOptions, callback: (err: string) => void): void
    upload(src: string, destination: string, callback: (err: string) => void): void
    download(src: string, destination: string, callback: (err: string) => void): void
    on(eventName: string, callback: () => void): void
  }

  export interface client {
    defaults(options: ScpOptions): void
    scp(fileName: string, options: ScpOptions | string, errCallback?: (err: string) => void): void
    scp(fileName: string, options: ScpOptions | string, glob: string, errCallback?: (err: string) => void): void
    scp(options: ScpOptions, fileName: string, errCallback?: (err: string) => void): void
  }

  declare const defaultClient: client

  export default defaultClient
}
