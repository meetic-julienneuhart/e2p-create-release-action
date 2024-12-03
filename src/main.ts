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
        rootDir: core.getInput('npm_package_root_dir')
      },
      csproj: {
        update: core.getInput('update_csproj') === 'true',
        rootDir: core.getInput('csproj_root_dir')
      },
      sbt: {
        update: core.getInput('update_version_sbt') === 'true',
        rootDir: core.getInput('version_sbt_root_dir')
      },
      helm: {
        update: core.getInput('update_helm_chart') === 'true',
        rootDir: core.getInput('helm_chart_root_dir')
      }
    }

    const release = new Release(
      token,
      version.startsWith('v') ? version : 'v' + version,
      versionFilesConfig
    )
    await release.create()
  } catch (error) {
    // Fail the workflow run if an error occurs.
    if (error instanceof Error) core.setFailed(error.message)
  }
}
