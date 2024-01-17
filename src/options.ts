import {minimatch} from 'minimatch'
import {TokenLimits} from './limits'

export class Options {
  debug: boolean
  disableReview: boolean
  disableReleaseNotes: boolean
  maxFiles: number
  reviewSimpleChanges: boolean
  reviewCommentLGTM: boolean
  pathFilters: PathFilter
  systemMessage: string
  openaiLightModel: string
  openaiHeavyModel: string
  openaiModelTemperature: number
  openaiRetries: number
  openaiTimeoutMS: number
  openaiConcurrencyLimit: number
  githubConcurrencyLimit: number
  lightTokenLimits: TokenLimits
  heavyTokenLimits: TokenLimits
  language: string

  constructor(
    debug: boolean,
    disableReview: boolean,
    disableReleaseNotes: boolean,
    maxFiles = '0',
    reviewSimpleChanges = false,
    reviewCommentLGTM = false,
    pathFilters: string[] | null = null,
    systemMessage = '',
    openaiLightModel = 'gpt-3.5-turbo',
    openaiHeavyModel = 'gpt-3.5-turbo',
    openaiModelTemperature = '0.0',
    openaiRetries = '3',
    openaiTimeoutMS = '120000',
    openaiConcurrencyLimit = '6',
    githubConcurrencyLimit = '6',
    language = 'en-US'
  ) {
    this.debug = debug
    this.disableReview = disableReview
    this.disableReleaseNotes = disableReleaseNotes
    this.maxFiles = parseInt(maxFiles)
    this.reviewSimpleChanges = reviewSimpleChanges
    this.reviewCommentLGTM = reviewCommentLGTM
    this.pathFilters = new PathFilter(pathFilters)
    this.systemMessage = systemMessage
    this.openaiLightModel = openaiLightModel
    this.openaiHeavyModel = openaiHeavyModel
    this.openaiModelTemperature = parseFloat(openaiModelTemperature)
    this.openaiRetries = parseInt(openaiRetries)
    this.openaiTimeoutMS = parseInt(openaiTimeoutMS)
    this.openaiConcurrencyLimit = parseInt(openaiConcurrencyLimit)
    this.githubConcurrencyLimit = parseInt(githubConcurrencyLimit)
    this.lightTokenLimits = new TokenLimits(openaiLightModel)
    this.heavyTokenLimits = new TokenLimits(openaiHeavyModel)
    this.language = language
  }

  // print all options using core.info
  print(): void {
    console.info(`debug: ${this.debug}`)
    console.info(`disable_review: ${this.disableReview}`)
    console.info(`disable_release_notes: ${this.disableReleaseNotes}`)
    console.info(`max_files: ${this.maxFiles}`)
    console.info(`review_simple_changes: ${this.reviewSimpleChanges}`)
    console.info(`review_comment_lgtm: ${this.reviewCommentLGTM}`)
    console.info(`path_filters: ${this.pathFilters}`)
    console.info(`system_message: ${this.systemMessage}`)
    console.info(`openai_light_model: ${this.openaiLightModel}`)
    console.info(`openai_heavy_model: ${this.openaiHeavyModel}`)
    console.info(`openai_model_temperature: ${this.openaiModelTemperature}`)
    console.info(`openai_retries: ${this.openaiRetries}`)
    console.info(`openai_timeout_ms: ${this.openaiTimeoutMS}`)
    console.info(`openai_concurrency_limit: ${this.openaiConcurrencyLimit}`)
    console.info(`github_concurrency_limit: ${this.githubConcurrencyLimit}`)
    console.info(`summary_token_limits: ${this.lightTokenLimits.string()}`)
    console.info(`review_token_limits: ${this.heavyTokenLimits.string()}`)
    console.info(`language: ${this.language}`)
  }

  checkPath(path: string): boolean {
    const ok = this.pathFilters.check(path)
    console.info(`checking path: ${path} => ${ok}`)
    return ok
  }
}

export class PathFilter {
  private readonly rules: Array<[string /* rule */, boolean /* exclude */]>

  constructor(rules: string[] | null = null) {
    this.rules = []
    if (rules != null) {
      for (const rule of rules) {
        const trimmed = rule?.trim()
        if (trimmed) {
          if (trimmed.startsWith('!')) {
            this.rules.push([trimmed.substring(1).trim(), true])
          } else {
            this.rules.push([trimmed, false])
          }
        }
      }
    }
  }

  check(path: string): boolean {
    if (this.rules.length === 0) {
      return true
    }

    let included = false
    let excluded = false
    let inclusionRuleExists = false

    for (const [rule, exclude] of this.rules) {
      if (minimatch(path, rule)) {
        if (exclude) {
          excluded = true
        } else {
          included = true
        }
      }
      if (!exclude) {
        inclusionRuleExists = true
      }
    }

    return (!inclusionRuleExists || included) && !excluded
  }
}

export class OpenAIOptions {
  model: string
  tokenLimits: TokenLimits

  constructor(model = 'gpt-3.5-turbo', tokenLimits: TokenLimits | null = null) {
    this.model = model
    if (tokenLimits != null) {
      this.tokenLimits = tokenLimits
    } else {
      this.tokenLimits = new TokenLimits(model)
    }
  }
}

export function getDebugDefault(): string {
  return "false";
}

export function getMaxFilesDefault(): string {
  return "150";
}

export function getReviewSimpleChangesDefault(): string {
  return "false";
}

export function getReviewCommentLgtmDefault(): string {
  return "false";
}

export function getPathFiltersDefault(): string {
  return `
      !dist/**
      !**/*.app
      !**/*.bin
      !**/*.bz2
      !**/*.class
      !**/*.db
      !**/*.csv
      !**/*.tsv
      !**/*.dat
      !**/*.dll
      !**/*.dylib
      !**/*.egg
      !**/*.glif
      !**/*.gz
      !**/*.xz
      !**/*.zip
      !**/*.7z
      !**/*.rar
      !**/*.zst
      !**/*.ico
      !**/*.jar
      !**/*.tar
      !**/*.war
      !**/*.lo
      !**/*.log
      !**/*.mp3
      !**/*.wav
      !**/*.wma
      !**/*.mp4
      !**/*.avi
      !**/*.mkv
      !**/*.wmv
      !**/*.m4a
      !**/*.m4v
      !**/*.3gp
      !**/*.3g2
      !**/*.rm
      !**/*.mov
      !**/*.flv
      !**/*.iso
      !**/*.swf
      !**/*.flac
      !**/*.nar
      !**/*.o
      !**/*.ogg
      !**/*.otf
      !**/*.p
      !**/*.pdf
      !**/*.doc
      !**/*.docx
      !**/*.xls
      !**/*.xlsx
      !**/*.ppt
      !**/*.pptx
      !**/*.pkl
      !**/*.pickle
      !**/*.pyc
      !**/*.pyd
      !**/*.pyo
      !**/*.pub
      !**/*.pem
      !**/*.rkt
      !**/*.so
      !**/*.ss
      !**/*.eot
      !**/*.exe
      !**/*.pb.go
      !**/*.lock
      !**/*.ttf
      !**/*.yaml
      !**/*.yml
      !**/*.cfg
      !**/*.toml
      !**/*.ini
      !**/*.mod
      !**/*.sum
      !**/*.work
      !**/*.json
      !**/*.mmd
      !**/*.svg
      !**/*.jpeg
      !**/*.jpg
      !**/*.png
      !**/*.gif
      !**/*.bmp
      !**/*.tiff
      !**/*.webm
      !**/*.woff
      !**/*.woff2
      !**/*.dot
      !**/*.md5sum
      !**/*.wasm
      !**/*.snap
      !**/*.parquet
      !**/gen/**
      !**/_gen/**
      !**/generated/**
      !**/@generated/**
      !**/vendor/**
      !**/*.min.js
      !**/*.min.js.map
      !**/*.min.js.css
      !**/*.tfstate
      !**/*.tfstate.backup
  `;
}

export function getDisableReviewDefault(): string {
  return "false";
}

export function getDisableReleaseNotesDefault(): string {
  return "false";
}

export function getOpenaiLightModelDefault(): string {
  return "gpt-3.5-turbo";
}

export function getOpenaiHeavyModelDefault(): string {
  return "gpt-4";
}

export function getOpenaiModelTemperatureDefault(): string {
  return "0.05";
}

export function getOpenaiRetriesDefault(): string {
  return "5";
}

export function getOpenaiTimeoutMsDefault(): string {
  return "360000";
}

export function getOpenaiConcurrencyLimitDefault(): string {
  return "6";
}

export function getGithubConcurrencyLimitDefault(): string {
  return "6";
}

export function getSystemMessageDefault(): string {
  return `
      You are \`@coderabbitai\` (aka \`github-actions[bot]\`), a language model 
      trained by OpenAI. Your purpose is to act as a highly experienced 
      software engineer and provide a thorough review of the code hunks
      and suggest code snippets to improve key areas such as:
        - Logic
        - Security
        - Performance
        - Data races
        - Consistency
        - Error handling
        - Maintainability
        - Modularity
        - Complexity
        - Optimization
        - Best practices: DRY, SOLID, KISS

      Do not comment on minor code style issues, missing 
      comments/documentation. Identify and resolve significant 
      concerns to improve overall code quality while deliberately 
      disregarding minor issues.
  `;
}

export function getSummarizeDefault(): string {
  return `
      Provide your final response in markdown with the following content:

      - **Walkthrough**: A high-level summary of the overall change instead of 
        specific files within 80 words.
      - **Changes**: A markdown table of files and their summaries. Group files 
        with similar changes together into a single row to save space.
      - **Poem**: Below the changes, include a whimsical, short poem written by 
        a rabbit to celebrate the changes. Format the poem as a quote using 
        the ">" symbol and feel free to use emojis where relevant.

      Avoid additional commentary as this summary will be added as a comment on the 
      GitHub pull request. Use the titles "Walkthrough" and "Changes" and they must be H2.
  `;
}

export function getSummarizeReleaseNotesDefault(): string {
  return `
      Craft concise release notes for the pull request. 
      Focus on the purpose and user impact, categorizing changes as "New Feature", "Bug Fix", 
      "Documentation", "Refactor", "Style", "Test", "Chore", or "Revert". Provide a bullet-point list, 
      e.g., "- New Feature: Added search functionality to the UI". Limit your response to 50-100 words 
      and emphasize features visible to the end-user while omitting code-level details.
  `;
}

export function getLanguageDefault(): string {
  return "en-US";
}

export function getBotIconDefault(): string {
  return "<img src=\"https://avatars.githubusercontent.com/in/347564?s=41\" alt=\"Image description\" width=\"20\" height=\"20\">";
}