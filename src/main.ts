import * as core from '@actions/core'
import { VersionFilesConfig, Release } from './release'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const version = core.getInput('version', { required: true })
    const versionFilesConfig: VersionFilesConfig = {
      npm: {
        update: core.getInput('update_npm_package') === 'true',
        packageRootDir: core.getInput('npm_package_root_dir')
      }
    }

    const release = new Release(
      token,
      version.startsWith('v') ? version : 'v' + version,
      versionFilesConfig
    )
    await release.create()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
