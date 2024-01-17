class PullRequest {
    id: number;
    owner: string;
    repoName: string;

    constructor(id: number, owner: string, repoName: string) {
        this.id = id;
        this.owner = owner;
        this.repoName = repoName;
    }

    static fromPrUrl(url: string): PullRequest {
        return new PullRequest(
            this.extractPullRequestNumber(url),
            this.extractOwner(url),
            this.extractRepo(url)
        );
    }

    static extractPullRequestNumber(prUrl: string): number {
        const match = prUrl.match(/\/pull\/(\d+)$/);
        
        if (match && match[1]) {
            return parseInt(match[1]);
        } else {
            throw Error('PR番号を抽出できませんでした。');
        }
    }

    static extractOwner(prUrl: string): string {
        const match = prUrl.match(/git\.dmm\.com\/([^\/]+)\/([^\/]+)/);
        if (match && match[1]) {
            return match[1];
        } else {
            throw Error('PRのオーナーを抽出できませんした。');
        }
    }

    static extractRepo(prUrl: string): string {
        const match = prUrl.match(/git\.dmm\.com\/([^\/]+)\/([^\/]+)/);
        if (match && match[2]) {
            return match[2];
        } else {
            throw Error('PRのリポジトリ名を抽出できませんでした。');
        }
    }
}
