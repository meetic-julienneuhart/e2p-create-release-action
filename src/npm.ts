import * as fs from 'fs'
import * as core from '@actions/core'

interface Package {
  version?: string
  [key: string]: unknown
}

export class Npm {
  private readonly version: string
  private readonly packageRootDir: string

  constructor(version: string, packageRootDir: string) {
    this.version = version.replaceAll('v', '')
    this.packageRootDir =
      !packageRootDir.endsWith('/') && packageRootDir.length > 0
        ? packageRootDir + '/'
        : packageRootDir
  }

  /**
   * Write the version property to the specified file.
   * @param filePath The filepath.
   * @private
   */
  private writeVersion(filePath: string): void {
    const raw = fs.readFileSync(filePath, 'utf-8')

    const json = JSON.parse(raw) as Package
    json.version = this.version
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2) + '\n', 'utf-8')
  }

  /**
   * Update the version property of the package.json and package-lock.json
   * files.
   * @returns {string[]} The list of modified files.
   */
  updateVersion(): string[] {
    const modifiedFiles: string[] = []

    const packageFilePath = this.packageRootDir + 'package.json'
    this.writeVersion(packageFilePath)
    modifiedFiles.push(packageFilePath)
    core.info(`${packageFilePath} has been successfully updated`)

    const packageLockFilePath = this.packageRootDir + 'package-lock.json'
    if (fs.existsSync(packageLockFilePath)) {
      this.writeVersion(packageLockFilePath)
      modifiedFiles.push(packageLockFilePath)
      core.info(`${packageLockFilePath} has been successfully updated`)
    } else {
      core.warning(`No ${packageLockFilePath} file found`)
    }

    return modifiedFiles
  }
}
