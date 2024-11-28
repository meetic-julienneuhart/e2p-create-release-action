import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { Changelog } from './changelog'
import * as core from '@actions/core'
import fs from 'fs'

export class Release {
  private octokit: InstanceType<typeof GitHub>
  private changelog: InstanceType<typeof Changelog>
  private readonly version: string
  private modifiedFiles: string[]

  /**
   * @param token The GitHub token to use.
   * @param version The version to release.
   */
  constructor(token: string, version: string) {
    this.octokit = github.getOctokit(token)
    this.changelog = new Changelog(this.octokit)
    this.version = version
    this.modifiedFiles = []
  }

  /**
   * Generate the CHANGELOG.md file for last 10 releases.
   * @private
   */
  private async generateChangelog(): Promise<void> {
    core.startGroup(`Generate CHANGELOG.md`)

    await this.changelog.generate(this.version, 9)
    this.modifiedFiles.push('CHANGELOG.md')

    core.info(`CHANGELOG.md has been successfully generated`)
    core.endGroup()
  }

  /**
   * Commit and push all changes.
   * @param defaultBranch The default branch of the repository.
   * @param latestCommitSha The latest commit SHA.
   * @private
   */
  private async commitAndPushChanges(
    defaultBranch: string,
    latestCommitSha: string
  ): Promise<void> {
    core.startGroup(`Commit and push changes`)

    const { data: latestCommit } = await this.octokit.rest.git.getCommit({
      ...github.context.repo,
      commit_sha: latestCommitSha
    })

    const createBlob = () => async (filePath: string) => {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const { data: blob } = await this.octokit.rest.git.createBlob({
        ...github.context.repo,
        content: content,
        encoding: 'utf-8'
      })
      return blob
    }

    const blobs = await Promise.all(this.modifiedFiles.map(createBlob()))

    const tree = await this.octokit.rest.git.createTree({
      ...github.context.repo,
      tree: blobs.map(({ sha }, index) => ({
        path: this.modifiedFiles[index],
        mode: `100644`,
        type: `blob`,
        sha
      })),
      base_tree: latestCommit.tree.sha
    })

    const { data: newCommit } = await this.octokit.rest.git.createCommit({
      ...github.context.repo,
      message: `ci(skip): ${this.version}`,
      tree: tree.data.sha,
      parents: [latestCommitSha]
    })

    await this.octokit.rest.git.updateRef({
      ...github.context.repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.sha
    })

    core.info(
      `Changes have been successfully committed and pushed to ${defaultBranch}`
    )
    core.endGroup()
  }

  /**
   * Create a GitHub release and its corresponding tag.
   * @private
   */
  private async createRelease(): Promise<void> {
    core.startGroup(`Create release ${this.version}`)

    const changelog = await this.changelog.release()
    await this.octokit.rest.repos.createRelease({
      ...github.context.repo,
      tag_name: this.version,
      name: this.version,
      make_latest: 'true',
      body: changelog
    })

    core.info(`Release ${this.version} has been successfully created`)
    core.endGroup()
  }

  /**
   * Release creation encapsulates many steps:
   * 1. Generate a CHANGELOG.md file.
   * 2. Generate and/or update all version files.
   * 3. Commit and push all changes.
   * 4. Create a GitHub release and its corresponding tag.
   */
  async create(): Promise<void> {
    const { data: repo } = await this.octokit.rest.repos.get({
      ...github.context.repo
    })

    const { data: ref } = await this.octokit.rest.git.getRef({
      ...github.context.repo,
      ref: `heads/${repo.default_branch}`
    })

    await this.generateChangelog()
    await this.commitAndPushChanges(repo.default_branch, ref.object.sha)
    await this.createRelease()
  }
}
