import fs from 'fs'
import { Helm } from '../src/helm'

beforeEach(() => {
  if (fs.existsSync(`${__dirname}/Chart.yaml`)) {
    fs.unlinkSync(`${__dirname}/Chart.yaml`)
  }
})

afterEach(() => {
  if (fs.existsSync(`${__dirname}/Chart.yaml`)) {
    fs.unlinkSync(`${__dirname}/Chart.yaml`)
  }
})

describe('helm', () => {
  it('throws an error if the Chart.yaml file does not exist', () => {
    expect(fs.existsSync(`${__dirname}/Chart.yaml`)).toStrictEqual(false)
    expect(() => new Helm('1.0.0', __dirname).updateVersion()).toThrow()
  })

  it('updates the Chart.yaml file', () => {
    expect(fs.existsSync(`${__dirname}/Chart.yaml`)).toStrictEqual(false)

    fs.writeFileSync(
      `${__dirname}/Chart.yaml`,
      `apiVersion: v2
appVersion: 0.1.0
name: mychart
version: 0.1.0
description: A simple Helm chart
`
    )

    const version = '1.0.0'
    const helm = new Helm(version, __dirname)
    const filepath = helm.updateVersion()

    expect(filepath).toStrictEqual(`${__dirname}/Chart.yaml`)
    expect(fs.existsSync(filepath)).toStrictEqual(true)

    const content = fs.readFileSync(filepath, 'utf-8')
    expect(content).toStrictEqual(`apiVersion: v2
appVersion: ${version}
name: mychart
version: ${version}
description: A simple Helm chart
`)
  })
})
