declare module 'ali-oss' {
  interface OSSOptions {
    region: string
    accessKeyId: string
    accessKeySecret: string
    bucket: string
    secure?: boolean
  }

  interface PutResult {
    name: string
    url: string
    res: {
      status: number
      headers: Record<string, string>
    }
  }

  class OSS {
    constructor(options: OSSOptions)
    put(name: string, file: string | Buffer): Promise<PutResult>
    get(name: string): Promise<{ content: Buffer }>
    delete(name: string): Promise<void>
  }

  export default OSS
}
