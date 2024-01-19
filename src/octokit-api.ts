import { PullRequest } from "./github/pull-request";
import { PullRequestDetail } from "./github/pull-request-detail";
import { octokit } from "./octokit-enterprise";

export class OctokitApi {
    pr: PullRequest

    constructor(pr: PullRequest) {
        this.pr = pr;
    }

    async getPullRequest(): Promise<PullRequestDetail> {
        let properties = Object.getOwnPropertyNames(octokit.enterpriseAdmin);
        console.log(properties);
        console.info('octokit get pulls')
        const prDetail = await octokit.pullRequests.get({
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