import { PullRequest } from "./github/pull-request";
import { PullRequestDetail } from "./github/pull-request-detail";
import { octokit } from "./octokit-enterprise";

export class OctokitApi {
    pr: PullRequest

    constructor(pr: PullRequest) {
        this.pr = pr;
    }

    async getPullRequest(): Promise<PullRequestDetail> {
        const prDetail = await octokit.pulls.get({
            owner: this.pr.owner,
            repo: this.pr.repoName,
            pull_number: this.pr.id,
        })

        console.info(Object.keys(prDetail))

        return new PullRequestDetail(
            prDetail['title'],
            prDetail['body'],
            prDetail['head']['sha'],
            prDetail['base']['sha'],
        )
    }
}