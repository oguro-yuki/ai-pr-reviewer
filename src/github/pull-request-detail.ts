export class PullRequestDetail {
    title: string;
    body: string;
    headSha: string
    baseSha: string

    constructor(title: string, body: string, headSha: string, baseSha: string) {
        this.title = title;
        this.body = body;
        this.headSha = headSha;
        this.baseSha = baseSha;
    }
}
