import * as fs from 'fs'
import * as core from '@actions/core'
import { parseStringPromise, Builder } from 'xml2js'

interface CsProjXml {
  Project: Project
}

interface Project {
  PropertyGroup?: PropertyGroup | PropertyGroup[]
  [key: string]: unknown
}

interface PropertyGroup {
  Version?: string[]
  [key: string]: unknown
}

export class CsProj {
  private readonly version: string
  private readonly rootDir: string

  constructor(version: string, rootDir: string) {
    this.version = version.replace(/^v/, '')
    this.rootDir =
      !rootDir.endsWith('/') && rootDir.length > 0 ? rootDir + '/' : rootDir
  }

  /**
   * Write the Version element to the specified .csproj file.
   * @param filePath The file path.
   * @private
   */
  private async writeVersion(filePath: string): Promise<void> {
    const raw = fs.readFileSync(filePath, 'utf-8')
    const xml = (await parseStringPromise(raw)) as CsProjXml

    if (!xml.Project || !xml.Project.PropertyGroup) {
      throw new Error('Invalid .csproj file structure')
    }

    const propertyGroups = Array.isArray(xml.Project.PropertyGroup)
      ? xml.Project.PropertyGroup
      : [xml.Project.PropertyGroup]

    let versionSet = false

    for (const propertyGroup of propertyGroups) {
      if (propertyGroup.Version) {
        propertyGroup.Version[0] = this.version
        versionSet = true
        break
      }
    }

    if (!versionSet) {
      if (!propertyGroups[0]) {
        propertyGroups[0] = {}
      }
      propertyGroups[0].Version = [this.version]
    }

    const builder = new Builder({
      headless: true
    })
    fs.writeFileSync(filePath, builder.buildObject(xml) + '\n', 'utf-8')
  }

  /**
   * Update the Version element of the .csproj file(s).
   * @returns {Promise<string[]>} The list of modified files.
   */
  async updateVersion(): Promise<string[]> {
    const modifiedFiles: string[] = []

    const files = fs.readdirSync(this.rootDir)
    const csprojFiles = files.filter(file => file.endsWith('.csproj'))

    if (csprojFiles.length === 0) {
      throw new Error(`No .csproj files found in directory ${this.rootDir}`)
    }

    for (const csprojFile of csprojFiles) {
      const filePath = `${this.rootDir}${csprojFile}`
      await this.writeVersion(filePath)
      modifiedFiles.push(filePath)
      core.info(`${filePath} has been successfully updated`)
    }

    return modifiedFiles
  }
}
