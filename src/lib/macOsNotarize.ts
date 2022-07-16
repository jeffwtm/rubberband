import axios from 'axios'
import { join } from 'path'
import { Shell } from './shell'
import { parseCliResponseObject } from './utils'

export type SignAndNotarizeOptions = {
  sh: Shell
  password: string
  buildPath: string
  gamemakerPath: string
  appSource: string
  appDest: string
  appNotarized: string
  appleUser: string
  applePassword: string
  providerShortName: string
  signingCertificate: string
  bundleid: string
  localOutputPath: string
  useEntitlements: boolean
}

export const signAndNotarize = async (
  options: SignAndNotarizeOptions,
  logData: (data: any) => void
): Promise<boolean> => {
  const {
    sh,
    password,
    buildPath,
    gamemakerPath,
    appSource,
    appDest,
    appNotarized,
    appleUser,
    applePassword,
    providerShortName,
    signingCertificate,
    bundleid,
    localOutputPath,
    useEntitlements,
  } = options
  const NotarizationStatus = {
    Pending: 1,
    Failed: 2,
    Succeeded: 3,
  }

  const checkNotarizationStatus = async (requestid: string) => {
    const response = await sh.spawn(
      `xcrun altool --notarization-info ${requestid} --username ${appleUser} --password ${applePassword} --asc-provider ${providerShortName}`
    )
    const fields = ['LogFileURL', 'Status', 'Status Code', 'Status Message']
    const status = parseCliResponseObject(response, fields)

    // console.log(status);

    if (status.LogFileURL) {
      const log = await axios.get(status.LogFileURL)
      const logFile = log.data
      logData(logFile)

      if (logFile.issues) {
        //do something if there are warnings
      }
    }

    if (status.Status == 'success' && status.StatusCode == '0') return NotarizationStatus.Succeeded
    else if (status.Status == 'invalid' && status.StatusCode == '2') return NotarizationStatus.Failed
    else return NotarizationStatus.Pending
  }

  const stapleNotarizedApp = async () => {
    await sh.spawn(`xcrun stapler staple "${buildPath}/signed/${appDest}.app"`)
    await sh.spawn(`spctl -a -v "${buildPath}/signed/${appDest}.app"`)
  }

  const zipAndTransfer = async () => {
    await sh.exec(`mkdir -p "${buildPath}/notarized/"`)
    await sh.exec(`rm -rf "${buildPath}/notarized/${appNotarized}.zip"`)
    await sh.exec(
      `ditto -c -k --sequesterRsrc --keepParent "${buildPath}/signed/${appDest}.app" "${buildPath}/notarized/${appNotarized}.zip"`
    )
    await sh.download(`${buildPath}/notarized/${appNotarized}.zip`, join(localOutputPath, `${appNotarized}.zip`))
  }

  const codesignApp = async (useEntitlements: boolean) => {
    await sh.exec(`chmod -R a+xr "${buildPath}/signed/${appDest}.app"`)
    if (useEntitlements) await sh.exec(`plutil "${buildPath}/steam_build.entitlements"`)
    await sh.exec(`security unlock-keychain -p "${password}" && security find-certificate -c '${signingCertificate}'`)
    await sh.spawn(
      `security unlock-keychain -p "${password}"; codesign --deep --force --verify --verbose --timestamp --options runtime ` +
        (useEntitlements ? `--entitlements "${buildPath}/steam_build.entitlements" ` : '') +
        `--sign "${signingCertificate}" "${buildPath}/signed/${appDest}.app"`
    )
    await sh.spawn(`codesign --display --verbose "${buildPath}/signed/${appDest}.app"`)
    await sh.exec(`rm -rf "${buildPath}/signed/${appDest}.zip"`)
    await sh.exec(
      `ditto -c -k --sequesterRsrc --keepParent "${buildPath}/signed/${appDest}.app" "${buildPath}/signed/${appDest}.zip"`
    )
    await sh.exec(`ls -lh "${buildPath}/signed/"`)
  }

  const notarizeApp = async () => {
    const notarizationResult = await sh.spawn(
      `xcrun altool --notarize-app --username ${appleUser} --password ${applePassword} --asc-provider ${providerShortName} --primary-bundle-id ${bundleid} --file "${buildPath}/signed/${appDest}.zip"`
    )
    // logData(notarizationResult);

    const errors = notarizationResult.filter(
      (result: any) => result && typeof result == 'string' && result.match(/Error: .*/)
    )

    // const errors = notarizationResult.toString().match(/Error: .*/g);
    if (errors.length) {
      errors.forEach((error: any) => logData(error))
      return
    }

    const requestid = parseCliResponseObject(notarizationResult, ['RequestUUID']).RequestUUID

    if (!requestid) {
      logData('Unknown error occurred. Could not retrieve Request UUID.')
      return
    }

    logData(`Waiting for notarization (${requestid})...`)

    let notarizationStatus = NotarizationStatus.Pending
    return await new Promise<boolean>(async (resolve, reject) => {
      while (notarizationStatus == NotarizationStatus.Pending) {
        await new Promise<void>(async (resolve) => {
          setTimeout(async () => {
            notarizationStatus = await checkNotarizationStatus(requestid)
            resolve()
          }, 1000 * 60)
        })
      }
      if (notarizationStatus == NotarizationStatus.Succeeded) resolve(true)
      else reject(false)
    })
  }

  const prepareApp = async (user: string) => {
    await sh.exec(`rm -rf "${buildPath}/signed/${appDest}.app"`)
    await sh.exec(
      `cp -r "${gamemakerPath.replace(
        '~/',
        `/Users/${user}/`
      )}/GMS2MAC/${appSource}/${appSource}.app" "${buildPath}/signed/${appDest}.app"`
    )
  }

  const fixSplashScreen = async () => {
    await sh.exec(
      `cp -f "${buildPath}/../splash.png" "${buildPath}/signed/${appDest}.app/Contents/Resources/splash.png"`
    )
  }

  let success: boolean | undefined = false

  const user = await sh.exec('whoami')

  await prepareApp(user)
  await fixSplashScreen()
  await codesignApp(useEntitlements)
  success = await notarizeApp()

  if (success) {
    await stapleNotarizedApp()
    await zipAndTransfer()
  }

  return !!success
}
