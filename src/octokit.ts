import { info, warning } from '@actions/core'
import { Octokit } from '@octokit/action'
import { retry } from '@octokit/plugin-retry'
import { throttling } from '@octokit/plugin-throttling'

const token = process.env.GITHUB_TOKEN
info(`token is ${token}`)

const RetryAndThrottlingOctokit = Octokit.plugin(throttling, retry)

export const octokit = new RetryAndThrottlingOctokit({
  auth: `${token}`,
  throttle: {
    onRateLimit: (
      retryAfter: number,
      options: any,
      _o: any,
      retryCount: number
    ) => {
      warning(
        `Request quota exhausted for request ${options.method} ${options.url}
Retry after: ${retryAfter} seconds
Retry count: ${retryCount}
`
      )
      if (retryCount <= 3) {
        warning(`Retrying after ${retryAfter} seconds!`)
        return true
      }
    },
    onSecondaryRateLimit: (retryAfter: number, options: any) => {
      warning(
        `SecondaryRateLimit detected for request ${options.method} ${options.url} ; retry after ${retryAfter} seconds`
      )
      // if we are doing a POST method on /repos/{owner}/{repo}/pulls/{pull_number}/reviews then we shouldn't retry
      if (
        options.method === 'POST' &&
        options.url.match(/\/repos\/.*\/.*\/pulls\/.*\/reviews/)
      ) {
        return false
      }
      return true
    }
  }
})


export async function getPRFile(owner: string, repo: string, pull_number: number) {
  // プルリクエストに含まれる全ファイルのリストを取得
  const { data: files } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number
  });

  // 変更ファイルが複数ある場合は複数で要約するため、ファイル全文を使ったレビューをしない
  if (files.length > 1) {
    return null
  }

  const { data: blob } = await octokit.git.getBlob({
    owner,
    repo,
    file_sha: files[0].sha,
  });

  // ファイルの内容をデコードして返却
  return Buffer.from(blob.content, 'base64').toString('utf-8')
}
