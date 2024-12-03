import { Sbt } from '../src/sbt'
import fs from 'fs'

beforeEach(() => {
  if (fs.existsSync(`${__dirname}/version.sbt`)) {
    fs.unlinkSync(`${__dirname}/version.sbt`)
  }
})

afterEach(() => {
  if (fs.existsSync(`${__dirname}/version.sbt`)) {
    fs.unlinkSync(`${__dirname}/version.sbt`)
  }
})

describe('sbt', () => {
  it('creates the version.sbt file and updates it accordingly', () => {
    expect(fs.existsSync(`${__dirname}/version.sbt`)).toStrictEqual(false)

    // Create.
    let version = '1.0.0'
    let sbt = new Sbt(version, __dirname)
    let filepath = sbt.updateVersion()

    expect(filepath).toStrictEqual(`${__dirname}/version.sbt`)
    expect(fs.existsSync(filepath)).toStrictEqual(true)

    let content = fs.readFileSync(filepath, 'utf-8')
    expect(content).toStrictEqual(`ThisBuild / version := "${version}"\n`)

    // Update.
    version = '2.0.0'
    sbt = new Sbt(version, __dirname)
    filepath = sbt.updateVersion()
    content = fs.readFileSync(filepath, 'utf-8')
    expect(content).toStrictEqual(`ThisBuild / version := "${version}"\n`)
  })
})
