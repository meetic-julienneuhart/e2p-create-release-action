import Stream from 'stream'
import fs from 'fs'
import config from '@typescript-eslint/eslint-plugin/use-at-your-own-risk/eslint-recommended-raw'

export class Changelog {
  /**
   * Generate the release CHANGELOG.
   * @returns {Promise<string>} The release CHANGELOG.
   */
  async release(): Promise<string> {
    const stream = await this.stream(1)
    return new Promise<string>((resolve): void => {
      let changelog = ''
      stream
        .on('data', (data: string) => {
          changelog += data.toString()
        })
        .on('end', () => resolve(changelog))
    })
  }

  /**
   * Generate the CHANGELOG.md for last releases.
   * @param releaseCount How many releases.
   * @returns {Promise<void>}
   */
  async generate(releaseCount: number): Promise<void> {
    const stream = await this.stream(releaseCount)
    stream.pipe(fs.createWriteStream('CHANGELOG.md'))
  }

  /**
   * Generate a CHANGELOG stream.
   * @param releaseCount How many releases.
   * @returns {Promise<Stream.Readable>} The CHANGELOG stream.
   * @private
   */
  private async stream(releaseCount: number): Promise<Stream.Readable> {
    const conventionalChangelog = await import('conventional-changelog')
    return conventionalChangelog.default({
      preset: 'conventionalcommits',
      releaseCount: releaseCount
    })
  }
}
