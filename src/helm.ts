import * as fs from 'fs'
import * as core from '@actions/core'
import yaml from 'yaml'

export class Helm {
  private readonly version: string
  private readonly rootDir: string

  constructor(version: string, rootDir: string) {
    this.version = version.replace(/^v/, '')
    this.rootDir =
      !rootDir.endsWith('/') && rootDir.length > 0 ? rootDir + '/' : rootDir
  }

  /**
   * Update the Chart.yaml file.
   * @returns {string} The file path of the Chart.yaml file.
   */
  updateVersion(): string {
    const filepath = `${this.rootDir}Chart.yaml`
    const raw = fs.readFileSync(filepath, 'utf-8')

    const chart = yaml.parseDocument(raw)
    chart.set('version', this.version)
    chart.set('appVersion', this.version)

    fs.writeFileSync(filepath, `${chart.toString()}`, 'utf-8')
    core.info(`${filepath} has been successfully updated`)

    return filepath
  }
}
