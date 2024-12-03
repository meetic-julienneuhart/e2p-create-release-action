import fs from 'fs'
import { Npm } from '../src/npm'

beforeEach(() => {
  if (fs.existsSync(`${__dirname}/package.json`)) {
    fs.unlinkSync(`${__dirname}/package.json`)
  }
  if (fs.existsSync(`${__dirname}/package-lock.json`)) {
    fs.unlinkSync(`${__dirname}/package-lock.json`)
  }
})

afterEach(() => {
  if (fs.existsSync(`${__dirname}/package.json`)) {
    fs.unlinkSync(`${__dirname}/package.json`)
  }
  if (fs.existsSync(`${__dirname}/package-lock.json`)) {
    fs.unlinkSync(`${__dirname}/package-lock.json`)
  }
})

describe('npm', () => {
  it('throws an error if the package.json file does not exist', () => {
    expect(fs.existsSync(`${__dirname}/package.json`)).toStrictEqual(false)
    expect(() => new Npm('1.0.0', __dirname).updateVersion()).toThrow()
  })

  it('updates the package.json file', () => {
    expect(fs.existsSync(`${__dirname}/package.json`)).toStrictEqual(false)

    fs.writeFileSync(
      `${__dirname}/package.json`,
      `{
  "name": "my-basic-project",
  "version": "0.1.0",
  "description": "A basic Node.js project",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT"
}
`
    )

    const version = '1.0.0'
    const npm = new Npm(version, __dirname)
    const filepaths = npm.updateVersion()

    expect(filepaths).toHaveLength(1)
    expect(filepaths[0]).toStrictEqual(`${__dirname}/package.json`)
    expect(fs.existsSync(filepaths[0])).toStrictEqual(true)

    const content = fs.readFileSync(filepaths[0], 'utf-8')
    expect(content).toStrictEqual(`{
  "name": "my-basic-project",
  "version": "${version}",
  "description": "A basic Node.js project",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT"
}
`)
  })

  it('update the package-lock.json if it exists', () => {
    expect(fs.existsSync(`${__dirname}/package-lock.json`)).toStrictEqual(false)

    fs.writeFileSync(
      `${__dirname}/package.json`,
      `{
  "name": "my-basic-project",
  "version": "0.1.0",
  "description": "A basic Node.js project",
  "main": "index.js",
  "author": "Your Name",
  "license": "MIT"
}
`
    )
    fs.writeFileSync(
      `${__dirname}/package-lock.json`,
      `{
  "name": "my-basic-project",
  "version": "0.1.0",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "my-basic-project",
      "version": "0.1.0",
      "license": "MIT"
    }
  }
}
`
    )

    const version = '1.0.0'
    const npm = new Npm(version, __dirname)
    const filepaths = npm.updateVersion()

    expect(filepaths).toHaveLength(2)
    expect(filepaths[1]).toStrictEqual(`${__dirname}/package-lock.json`)
    expect(fs.existsSync(filepaths[1])).toStrictEqual(true)

    const content = fs.readFileSync(filepaths[1], 'utf-8')
    expect(content).toStrictEqual(`{
  "name": "my-basic-project",
  "version": "${version}",
  "lockfileVersion": 2,
  "requires": true,
  "packages": {
    "": {
      "name": "my-basic-project",
      "version": "${version}",
      "license": "MIT"
    }
  }
}
`)
  })
})
