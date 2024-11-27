import * as github from '@actions/github'
import { GitHub } from '@actions/github/lib/utils'
import { Changelog } from './changelog'
import * as core from '@actions/core'
import fs from 'fs'

export class Release {
  private changelog: InstanceType<typeof Changelog>
  private octokit: InstanceType<typeof GitHub>
  private readonly version: string
  private modifiedFiles: string[]

  /**
   * @param token The GitHub token to use.
   * @param version The version to release.
   */
  constructor(token: string, version: string) {
    this.changelog = new Changelog()
    this.octokit = github.getOctokit(token)
    this.version = version
    this.modifiedFiles = []
  }

  /**
   * Create a tag.
   * @param commitSha The commit SHA to create a tag from.
   * @private
   */
  private async createTag(commitSha: string): Promise<void> {
    core.startGroup(`Create tag ${this.version}`)

    await this.octokit.rest.git.createRef({
      ...github.context.repo,
      ref: `refs/tags/${this.version}`,
      sha: commitSha
    })

    core.info(`Tag ${this.version} has been successfully created`)
    core.endGroup()
  }

  /**
   * Generate the CHANGELOG.md file for last 10 releases.
   * @private
   */
  private async generateChangelog(): Promise<void> {
    const releaseCount = 10
    core.startGroup(`Generate CHANGELOG.md for last ${releaseCount} releases`)

    const changelog = new Changelog()
    await changelog.generate(releaseCount)
    this.modifiedFiles.push('CHANGELOG.md')

    core.info(
      `CHANGELOG.md has been successfully generated with last ${releaseCount} releases`
    )
    core.endGroup()
  }

  /**
   * Commit and push all changes.
   * @param defaultBranch The default branch of the repository.
   * @param latestCommitSha The lastest commit SHA.
   * @private
   */
  private async commitAndPushChanges(
    defaultBranch: string,
    latestCommitSha: string
  ): Promise<void> {
    core.startGroup(`Commit and push changes`)

    const latestCommit = await this.octokit.rest.git.getCommit({
      ...github.context.repo,
      commit_sha: latestCommitSha
    })

    const createBlob = () => async (filePath: string) => {
      const content = await fs.promises.readFile(filePath, 'utf8')
      const blob = await this.octokit.rest.git.createBlob({
        ...github.context.repo,
        content: content,
        encoding: 'utf-8'
      })
      return blob.data
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
      base_tree: latestCommit.data.tree.sha
    })

    const newCommit = await this.octokit.rest.git.createCommit({
      ...github.context.repo,
      message: `ci(skip): ${this.version}`,
      tree: tree.data.sha,
      parents: [latestCommitSha]
    })

    await this.octokit.rest.git.updateRef({
      ...github.context.repo,
      ref: `heads/${defaultBranch}`,
      sha: newCommit.data.sha
    })

    core.info(
      `Changes have been successfully committed and pushed to ${defaultBranch}`
    )
    core.endGroup()
  }

  /**
   * Create a GitHub release.
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
      generate_release_notes: true
      //body: changelog,
    })

    core.info(`Release ${this.version} has been successfully created`)
    core.endGroup()
  }

  /**
   * Release creation encapsulates many steps:
   * 1. Create a tag based on the given version and the latest commit.
   * 2. Generate a CHANGELOG.md file.
   * 3. Generate and/or update all version files.
   * 4. Commit and push all changes.
   * 5. Create a GitHub release.
   */
  async create(): Promise<void> {
    const repo = await this.octokit.rest.repos.get({
      ...github.context.repo
    })

    const ref = await this.octokit.rest.git.getRef({
      ...github.context.repo,
      ref: `heads/${repo.data.default_branch}`
    })

    await this.createTag(ref.data.object.sha)
    await this.generateChangelog()
    await this.commitAndPushChanges(
      repo.data.default_branch,
      ref.data.object.sha
    )
    await this.createRelease()
  }
}
