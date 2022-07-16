declare module 'node-vdf' {
  export interface vdf {
    parse(data: string): any
    dump(data: any): any
  }

  declare const defaultVdf: vdf
  export default defaultVdf
}
