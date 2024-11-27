import * as core from '@actions/core'
import { Release } from './release'

/**
 * The main function for the action.
 * @returns {Promise<void>} Resolves when the action is complete.
 */
export async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const version = core.getInput('version', { required: true })

    const release = new Release(
      token,
      version.startsWith('v') ? version : 'v' + version
    )
    await release.create()
  } catch (error) {
    // Fail the workflow run if an error occurs
    if (error instanceof Error) core.setFailed(error.message)
  }
}
