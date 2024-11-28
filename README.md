# E2P Action Create Release

This action generates version files, CHANGELOG.md and GitHub releases based on
the Git history and commit messages.

## Usage

See [action.yml](action.yml)

```yaml
- uses: matchgroup-e2p/e2p-create-release-action@v0
  with:
    version: 'v0.1.0'
```
