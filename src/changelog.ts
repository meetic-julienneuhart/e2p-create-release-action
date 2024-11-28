import fs from 'fs'
import { GitHub } from '@actions/github/lib/utils'
import * as github from '@actions/github'
import * as core from '@actions/core'

type Commit = {
  message: string
  url: string
}

type CommitsPerRelease = {
  version: string
  commits: Commit[]
}

export class Changelog {
  private octokit: InstanceType<typeof GitHub>

  constructor(octokit: InstanceType<typeof GitHub>) {
    this.octokit = octokit
  }

  /**
   * Get the tag commit SHA.
   * @param tagName The tag name.
   * @returns {Promise<string>} The SHA.
   * @private
   */
  private async tagCommitSha(tagName: string): Promise<string> {
    const { data: ref } = await this.octokit.rest.git.getRef({
      ...github.context.repo,
      ref: `tags/${tagName}`
    })

    if (ref.object.type === 'commit') {
      return ref.object.sha
    }

    const { data: tag } = await this.octokit.rest.git.getTag({
      ...github.context.repo,
      tag_sha: ref.object.sha
    })

    return tag.object.sha
  }

  /**
   * Get all commits between BASE and HEAD.
   * @param base The BASE to compare HEAD to.
   * @param head The HEAD.
   * @returns {Promise<Commit[]>} The list of commits.
   * @private
   */
  private async commits(
    base: string | undefined,
    head: string
  ): Promise<Commit[]> {
    if (base) {
      const { data: compare } =
        await this.octokit.rest.repos.compareCommitsWithBasehead({
          ...github.context.repo,
          basehead: `${base}...${head}`
        })

      return compare.commits.map(commit => {
        return {
          message: commit.commit.message,
          url: commit.html_url
        }
      })
    }

    // No base, get all commits up to HEAD.
    const commits: Commit[] = []
    let page = 1
    let fetchedCommits

    do {
      const { data } = await this.octokit.rest.repos.listCommits({
        ...github.context.repo,
        sha: head,
        per_page: 100,
        page
      })

      fetchedCommits = data

      commits.push(
        ...fetchedCommits.map(commit => ({
          message: commit.commit.message,
          url: commit.html_url
        }))
      )

      page++
    } while (fetchedCommits.length === 100)

    return commits.reverse()
  }

  /**
   * Generate the release CHANGELOG.
   * @returns {Promise<string>} The release CHANGELOG.
   */
  async release(): Promise<string> {
    let baseSha: string | undefined

    try {
      const { data: previousRelease } =
        await this.octokit.rest.repos.getLatestRelease({
          ...github.context.repo
        })

      baseSha = await this.tagCommitSha(previousRelease.tag_name)
    } catch (error) {
      // No previous release
      baseSha = undefined
    }

    const commits = await this.commits(baseSha, 'HEAD')

    let changelog = ''
    for (const commit of commits) {
      changelog += `- ${commit.message} ${commit.url}\n`
    }

    return changelog
  }

  /**
   * Generate the CHANGELOG.md for last releases.
   * @param version The version being released.
   * @param releaseCount How many previous releases.
   * @returns {Promise<void>}
   */
  async generate(version: string, releaseCount: number): Promise<void> {
    const { data: releases } = await this.octokit.rest.repos.listReleases({
      ...github.context.repo,
      per_page: releaseCount,
      page: 1
    })

    core.debug(`Current release: ${releases.length}`)
    core.debug(`Found ${releases.length} previous releases`)

    const tagsSha: string[] = []
    for (const release of releases) {
      core.debug(`Get tag SHA for release ${release.tag_name}`)
      const sha = await this.tagCommitSha(release.tag_name)
      tagsSha.push(sha)
    }

    // Get commits for the version being released.
    let beingReleasedCommits: Commit[] = []
    if (releases.length > 0) {
      // There are previous releases.
      const latestReleaseSha = tagsSha[0]
      beingReleasedCommits = await this.commits(latestReleaseSha, 'HEAD')
    } else {
      // No previous releases.
      beingReleasedCommits = await this.commits(undefined, 'HEAD')
    }
    core.debug(
      `Found ${beingReleasedCommits.length} commits for release ${version}`
    )

    // Get commits for each previous release.

    const commitsPerPreviousRelease: CommitsPerRelease[] = []
    for (let index = 0; index < releases.length; index++) {
      const release = releases[index]
      const headSha = tagsSha[index]
      let baseSha: string | undefined

      if (index + 1 < releases.length) {
        baseSha = tagsSha[index + 1]
      } else {
        baseSha = undefined // Oldest release.
      }

      const commits = await this.commits(baseSha, headSha)
      core.debug(
        `Found ${commits.length} commits for release ${release.tag_name}`
      )

      commitsPerPreviousRelease.push({
        version: release.tag_name,
        commits: commits
      })
    }

    let changelog = `# ${version}\n`

    for (const commit of beingReleasedCommits) {
      changelog += `- ${commit.message} ${commit.url}\n`
    }

    for (const release of commitsPerPreviousRelease) {
      changelog += `\n# ${release.version}\n`

      for (const commit of release.commits) {
        changelog += `- ${commit.message} ${commit.url}\n`
      }
    }

    fs.writeFileSync('CHANGELOG.md', changelog)
  }
}
