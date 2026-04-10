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

// example review rules
/* 
{
  "code_style": [
    "no var",
    "prefer async/await",
    "no console.log in production"
  ],
  "architecture": [
    "follow MVC pattern",
    "no business logic in controllers"
  ],
  "security": [
    "validate all inputs",
    "no raw SQL queries"
  ],
  "performance": [
    "avoid nested loops over large arrays"
  ]
} 
*/

export async function getReviewRules(
  octokit: Octokit,
  owner: string,
  repo: string,
  _pull_number: number
) {
  try {
    const response = await octokit.repos.getContent({
      owner,
      repo,
      path: ".reviewrc.json",
    });

    const file = response.data as { content: string };
    const content = Buffer.from(file.content, "base64").toString("utf-8");
    return JSON.parse(content);
  } catch {
    return {
      rules: [
        "Use clean code practices",
        "Avoid unused variables",
        "Handle errors properly",
      ],
    };
  }
}
