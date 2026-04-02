import { Octokit } from "@octokit/rest";

export async function getDifferenceData(
  octokit: Octokit,
  owner: string,
  repo: string,
  pull_number: number
) {
  const diff = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number,
      headers: {
        accept: "application/vnd.github.v3.diff",
      },
    }
  );
  return diff.data as unknown as string;
}

export async function getReviewRules(
  _octokit: Octokit,
  _owner: string,
  _repo: string,
  _pull_number: number
) {
  return {
    rules: [
      "Use clean code practices",
      "Avoid unused variables",
      "Handle errors properly",
    ],
  };
}
