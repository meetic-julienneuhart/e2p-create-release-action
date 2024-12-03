import * as fs from 'fs'
import * as core from '@actions/core'

export class Sbt {
  private readonly version: string
  private readonly rootDir: string

  constructor(version: string, rootDir: string) {
    this.version = version.replace(/^v/, '')
    this.rootDir =
      !rootDir.endsWith('/') && rootDir.length > 0 ? rootDir + '/' : rootDir
  }

  /**
   * Update the version.sbt file.
   * @returns {string} The file path of the version.sbt file
   */
  updateVersion(): string {
    const filepath = `${this.rootDir}version.sbt`

    fs.writeFileSync(
      filepath,
      `ThisBuild / version := "${this.version}"\n`,
      'utf-8'
    )
    core.info(`${filepath} has been successfully updated`)

    return filepath
  }
}
