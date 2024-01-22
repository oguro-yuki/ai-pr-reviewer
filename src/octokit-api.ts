import { PullRequest } from "./github/pull-request";
import { PullRequestDetail } from "./github/pull-request-detail";
import { octokit } from "./octokit-enterprise";

export class OctokitApi {
    pr: PullRequest

    constructor(pr: PullRequest) {
        this.pr = pr;
    }

    async getPullRequest(): Promise<PullRequestDetail> {
        console.info(`github token is ${process.env.CIRCLE_PULL_REQUEST}`)
        const prDetail = await octokit.pulls.get({
            owner: this.pr.owner,
            repo: this.pr.repoName,
            pull_number: this.pr.id,
        })

        console.info('octokit get pulls completed')

        return new PullRequestDetail(
            prDetail['title'],
            prDetail['body'],
            prDetail['head']['sha'],
            prDetail['base']['sha'],
        )
    }
}