import { prepareBuilds } from './lib/build'

const options = {
  incrementBuild: true,
  build: true,
}

;(async () => {
  const { builds } = await prepareBuilds()
  console.log(builds)
  console.log(options)
  if (options.build) {
    for (const build of builds) {
      console.log(build.module)
      await build.module.build(build)
    }
  }
})()
