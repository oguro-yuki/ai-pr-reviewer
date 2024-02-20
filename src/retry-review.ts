import { info, warning } from '@actions/core'
// eslint-disable-next-line camelcase
import { context as github_context } from '@actions/github'
import { type Bot } from './bot'
import {
  COMMENT_REPLY_TAG,
  COMMENT_TAG,
  Commenter
} from './commenter'
import { Inputs } from './inputs'
import { getPRFile, octokit } from './octokit'
import { type Options } from './options'
import { type Prompts } from './prompts'

// eslint-disable-next-line camelcase
const context = github_context
const repo = context.repo
const ASK_BOT = '@coderabbitai'
const REVIEW_MENTION = '@review-ai'

export const retryReview = async (
  heavyBot: Bot,
  options: Options,
  prompts: Prompts
) => {
  const commenter: Commenter = new Commenter()
  const inputs: Inputs = new Inputs()

  if (context.eventName !== 'issue_comment') {
    warning(
      `Skipped: ${context.eventName} is not a pull_request_review_comment event`
    )
    return
  }

  if (!context.payload) {
    warning(`Skipped: ${context.eventName} event is missing payload`)
    return
  }


  const comment = context.payload.comment
  if (comment == null) {
    warning(`Skipped: ${context.eventName} event is missing comment`)
    return
  }

  const prNumber = context.payload.issue?.number;
  if(!prNumber) {
    warning(`Skipped: ${context.eventName} event is missing pull_request number`)
    return
  }
  const { data: pullRequest } = await octokit.pulls.get({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
  });

  if (
    pullRequest == null
  ) {
    warning(`Skipped: ${context.eventName} event is missing pull_request`)
    return
  }
  inputs.title = pullRequest.title
  if (pullRequest.body) {
    inputs.description = commenter.getDescription(
      pullRequest.body
    )
  }

  // check if the comment was created and not edited or deleted
  if (context.payload.action !== 'created') {
    warning(`Skipped: ${context.eventName} event is not created`)
    return
  }

  // Check if the comment is not from the bot itself
  if (
    !comment.body.includes(COMMENT_TAG) &&
    !comment.body.includes(COMMENT_REPLY_TAG) &&
    comment.body.includes(REVIEW_MENTION)
  ) {
    const pullNumber = pullRequest.number

    const fullContents = await getPRFile(context.repo.owner, context.repo.repo, pullNumber)
    if (!fullContents) {
      warning(`Skipped: file count is not one.`)
      return
    }
    inputs.rawSummary = fullContents

    const reviewResponse = await heavyBot.chat(
      prompts.renderSummarize(inputs)
    )
    if (reviewResponse === '') {
      info('summarize: nothing obtained from openai')
    }

    let summarizeComment = `${reviewResponse}`

    await commenter.comment(`${summarizeComment}`, COMMENT_TAG, 'create')
  } else {
    info(`Skipped: ${context.eventName} event is from the bot itself`)
  }
}
