import * as fs from 'fs'
import * as core from '@actions/core'

interface Package {
  version?: string
  [key: string]: unknown
}

interface PackageLock {
  version?: string
  packages?: {
    '': Package
    [key: string]: Package | undefined
  }
  [key: string]: unknown
}

export class Npm {
  private readonly version: string
  private readonly rootDir: string

  constructor(version: string, rootDir: string) {
    this.version = version.replace(/^v/, '')
    this.rootDir =
      !rootDir.endsWith('/') && rootDir.length > 0 ? rootDir + '/' : rootDir
  }

  /**
   * Update the version property of the package.json and package-lock.json
   * files.
   * @returns {string[]} The list of modified files.
   */
  updateVersion(): string[] {
    const modifiedFiles: string[] = []

    const packageFilePath = `${this.rootDir}package.json`
    const rawPackage = fs.readFileSync(packageFilePath, 'utf-8')

    const jsonPackage = JSON.parse(rawPackage) as Package
    jsonPackage.version = this.version

    fs.writeFileSync(
      packageFilePath,
      JSON.stringify(jsonPackage, null, 2) + '\n',
      'utf-8'
    )

    modifiedFiles.push(packageFilePath)
    core.info(`${packageFilePath} has been successfully updated`)

    const packageLockFilePath = `${this.rootDir}package-lock.json`
    if (fs.existsSync(packageLockFilePath)) {
      const rawPackageLock = fs.readFileSync(packageLockFilePath, 'utf-8')

      const jsonPackageLock = JSON.parse(rawPackageLock) as PackageLock
      jsonPackageLock.version = this.version

      if (jsonPackageLock.packages && jsonPackageLock.packages['']) {
        jsonPackageLock.packages[''].version = this.version
      }

      fs.writeFileSync(
        packageLockFilePath,
        JSON.stringify(jsonPackageLock, null, 2) + '\n',
        'utf-8'
      )

      modifiedFiles.push(packageLockFilePath)
      core.info(`${packageLockFilePath} has been successfully updated`)
    } else {
      core.warning(`No ${packageLockFilePath} file found`)
    }

    return modifiedFiles
  }
}
