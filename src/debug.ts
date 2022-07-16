import { Shell } from './lib/shell'
import config_yaml from 'config-yaml'

const config = config_yaml(__dirname + '/config.yml')
const { host, username, password } = config.platforms.mac.moduleConfig

const scpConfig = {
  host,
  username,
  password,
  // path: `/Users/jeffsmith/Projects/incominggames/build/steam_build.entitlements`
}

console.log(scpConfig)
;(async () => {
  const sh = new Shell(
    {
      host,
      username,
      password,
    },
    true
  )

  try {
    await sh.connect()
    await sh.download(
      '/Users/jeffsmith/Projects/incominggames/build/notarized/Shadow_of_Aya-steam.zip',
      'D:\\Dev Projects\\shadow of aya\\build\\macOS\\1.0.51\\Shadow_of_Aya-steam.zip'
    )
  } finally {
    await sh.close()
  }

  // try {

  //     await fse.mkdirs(localOutputPath);

  //     return await signAndNotarize({
  //         ...sshconfig,
  //         buildPath,
  //         gamemakerPath: this.gmsPlatformOptions.option_mac_output_dir,
  //         appSource: config.projectSafeName,
  //         appDest: config.projectName,
  //         appNotarized: config.projectSafeNameSuffixed,
  //         appleUser,
  //         applePassword,
  //         providerShortName,
  //         signingCertificate,
  //         bundleid,
  //         localOutputPath
  //     })
  // }
  // catch (e) {
  //     console.log('Error:', String(e));
  // }
})()
