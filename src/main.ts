import {Bot} from './bot'
import {
    getDebugDefault,
    getDisableReleaseNotesDefault,
    getDisableReviewDefault,
    getGithubConcurrencyLimitDefault,
    getLanguageDefault,
    getMaxFilesDefault,
    getOpenaiConcurrencyLimitDefault,
    getOpenaiHeavyModelDefault,
    getOpenaiLightModelDefault,
    getOpenaiModelTemperatureDefault,
    getOpenaiRetriesDefault,
    getOpenaiTimeoutMsDefault,
    getPathFiltersDefault,
    getReviewCommentLgtmDefault,
    getReviewSimpleChangesDefault,
    getSummarizeDefault,
    getSummarizeReleaseNotesDefault,
    getSystemMessageDefault,
    OpenAIOptions,
    Options
} from './options'
import {Prompts} from './prompts'
import {codeReview} from './review'
import {getMultilineString} from "./util";

async function run(): Promise<void> {
    const options: Options = new Options(
        JSON.parse(process.env.DEBUG ?? getDebugDefault()),
        JSON.parse(process.env.DISABLE_REVIEW ?? getDisableReviewDefault()),
        JSON.parse(process.env.DISABLE_RELEASE_NOTES ?? getDisableReleaseNotesDefault()),
        process.env.MAX_FILES ?? getMaxFilesDefault(),
        JSON.parse(process.env.REVIEW_SIMPLE_CHANGES ?? getReviewSimpleChangesDefault()),
        JSON.parse(process.env.REVIEW_COMMENT_LGTM ?? getReviewCommentLgtmDefault()),
        getMultilineString(process.env.PATH_FILTERS ?? getPathFiltersDefault()),
        process.env.SYSTEM_MESSAGE ?? getSystemMessageDefault(),
        process.env.OPENAI_LIGHT_MODEL ?? getOpenaiLightModelDefault(),
        process.env.OPENAI_HEAVY_MODEL ?? getOpenaiHeavyModelDefault(),
        process.env.OPENAI_MODEL_TEMPERATURE ?? getOpenaiModelTemperatureDefault(),
        process.env.OPENAI_RETRIES ?? getOpenaiRetriesDefault(),
        process.env.OPENAI_TIMEOUT_MS ?? getOpenaiTimeoutMsDefault(),
        process.env.OPENAI_CONCURRENCY_LIMIT ?? getOpenaiConcurrencyLimitDefault(),
        process.env.GITHUB_CONCURRENCY_LIMIT ?? getGithubConcurrencyLimitDefault(),
        process.env.LANGUAGE ?? getLanguageDefault()
    )

    // print options
    options.print()

    const prompts: Prompts = new Prompts(
        process.env.SUMMARIZE ?? getSummarizeDefault(),
        process.env.SUMMARIZE_RELEASE_NOTES ?? getSummarizeReleaseNotesDefault()
    )

    // Create two bots, one for summary and one for review

    let lightBot: Bot | null = null
    try {
        lightBot = new Bot(
            options,
            new OpenAIOptions(options.openaiLightModel, options.lightTokenLimits)
        )
    } catch (e: any) {
        console.warn(
            `Skipped: failed to create summary bot, please check your openai_api_key: ${e}, backtrace: ${e.stack}`
        )
        return
    }

    let heavyBot: Bot | null = null
    try {
        heavyBot = new Bot(
            options,
            new OpenAIOptions(options.openaiHeavyModel, options.heavyTokenLimits)
        )
    } catch (e: any) {
        console.warn(
            `Skipped: failed to create review bot, please check your openai_api_key: ${e}, backtrace: ${e.stack}`
        )
        return
    }

    try {
        // check if the event is pull_request
        if (
            process.env.EVENT_TYPE === 'pull_request'
        ) {
            await codeReview(lightBot, heavyBot, options, prompts)
        // CircleCIではレビューコメントのイベントを厳密に取れないため、レビューコメントに対する機能はオミットする
        // } else if (
        //     process.env.GITHUB_EVENT_NAME === 'pull_request_review_comment'
        // ) {
        //     await handleReviewComment(heavyBot, options, prompts)
        } else {
            console.warn('Skipped: this action only works on push events or pull_request')
        }
    } catch (e: any) {
        if (e instanceof Error) {
            throw Error(`Failed to run: ${e.message}, backtrace: ${e.stack}`)
        } else {
            throw Error(`Failed to run: ${e}, backtrace: ${e.stack}`)
        }
    }
}

process
    .on('unhandledRejection', (reason, p) => {
        console.warn(`Unhandled Rejection at Promise: ${reason}, promise is ${p}`)
    })
    .on('uncaughtException', (e: any) => {
        console.warn(`Uncaught Exception thrown: ${e}, backtrace: ${e.stack}`)
    })

await run()
