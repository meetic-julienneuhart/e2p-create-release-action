import fs from 'fs'
import { CsProj } from '../src/csproj'

beforeEach(() => {
  if (fs.existsSync(`${__dirname}/MyProject.csproj`)) {
    fs.unlinkSync(`${__dirname}/MyProject.csproj`)
  }
})

afterEach(() => {
  if (fs.existsSync(`${__dirname}/MyProject.csproj`)) {
    fs.unlinkSync(`${__dirname}/MyProject.csproj`)
  }
})

describe('csproj', () => {
  it('throws an error if there is no .csproj file', async () => {
    expect(fs.existsSync(`${__dirname}/MyProject.csproj`)).toStrictEqual(false)
    await expect(
      new CsProj('1.0.0', __dirname).updateVersion()
    ).rejects.toThrow(`No .csproj files found in directory ${__dirname}`)
  })

  it('throws an error if the .csproj file is invalid', async () => {
    expect(fs.existsSync(`${__dirname}/MyProject.csproj`)).toStrictEqual(false)

    fs.writeFileSync(`${__dirname}/MyProject.csproj`, `<html></html>`)
    await expect(
      new CsProj('1.0.0', __dirname).updateVersion()
    ).rejects.toThrow('Invalid .csproj file structure')
  })

  it('updates the .csproj file without a Version element', async () => {
    expect(fs.existsSync(`${__dirname}/MyProject.csproj`)).toStrictEqual(false)

    fs.writeFileSync(
      `${__dirname}/MyProject.csproj`,
      `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
`
    )

    const version = '1.0.0'
    const csproj = new CsProj(version, __dirname)
    const filepaths = await csproj.updateVersion()

    expect(filepaths).toHaveLength(1)
    expect(filepaths[0]).toStrictEqual(`${__dirname}/MyProject.csproj`)
    expect(fs.existsSync(filepaths[0])).toStrictEqual(true)

    const content = fs.readFileSync(filepaths[0], 'utf-8')
    expect(content).toStrictEqual(`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <Version>${version}</Version>
  </PropertyGroup>
</Project>
`)
  })

  it('updates the .csproj file with a Version element', async () => {
    expect(fs.existsSync(`${__dirname}/MyProject.csproj`)).toStrictEqual(false)

    fs.writeFileSync(
      `${__dirname}/MyProject.csproj`,
      `<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <Version>0.0.1</Version>
  </PropertyGroup>
</Project>
`
    )

    const version = '1.0.0'
    const csproj = new CsProj(version, __dirname)
    const filepaths = await csproj.updateVersion()

    expect(filepaths).toHaveLength(1)
    expect(filepaths[0]).toStrictEqual(`${__dirname}/MyProject.csproj`)
    expect(fs.existsSync(filepaths[0])).toStrictEqual(true)

    const content = fs.readFileSync(filepaths[0], 'utf-8')
    expect(content).toStrictEqual(`<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net6.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
    <Version>${version}</Version>
  </PropertyGroup>
</Project>
`)
  })
})
