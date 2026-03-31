import { Octokit } from "@octokit/rest";

export async function getDifferenceData (
    oktokit: Octokit,
    owner: string,
    repo: string,
    pull_number: number
) {
    const diff = await oktokit.request("GET /repos/{owner}/{repo}/pulls/{pull_number}",
        {
            owner,
            repo,
            pull_number,
            headers:{
                accept: "application/vnd.github.v3.diff",
            },
        }

    )
    return diff.data as unknown as string;

}