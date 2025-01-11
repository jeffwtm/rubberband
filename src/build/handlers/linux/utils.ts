import { Shell } from '../../../utils'

export type CreateTestCopyOptions = {
  sh: Shell
  gamemakerPath: string
  appSource: string
  testFilePath: string
  extractFolder: string
}

export const createTestCopy = async (options: CreateTestCopyOptions, logData: (data: any) => void): Promise<void> => {
  const { sh, testFilePath, gamemakerPath, appSource, extractFolder } = options

  const prepareApp = async (user: string) => {
    const srcPath = `${gamemakerPath.replace('~/', `/home/${user}/`)}/GameMakerStudio2/${appSource}`
    const destZipPath = testFilePath.replace('~/', `/home/${user}/`)
    const extractToPath = extractFolder.replace('~/', `/home/${user}/`)
    console.log(`copying from "${srcPath}" to "${destZipPath}"`)
    await sh.exec(`rm -rf "${destZipPath}"`)
    await sh.exec(`cp -r "${srcPath}" "${destZipPath}"`)
    await sh.exec(`rm -rf "${extractToPath}"`)
    await sh.exec(`unzip ${destZipPath} -d ${extractToPath}`)
    await sh.exec(`cp "${extractToPath}/assets/run.sh" "${extractToPath}/run.sh"`)
    await sh.exec(`chmod +x ${extractToPath}/run.sh`)
  }

  const user = await sh.exec('whoami')

  await prepareApp(user)
}
