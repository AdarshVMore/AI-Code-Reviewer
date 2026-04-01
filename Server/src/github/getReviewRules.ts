import { Octokit } from "@octokit/rest";

export async function getReviewRules(
    octokit:Octokit,
    owner: string,
    repo: string,
    pull_number: number
) {
    // try {
    //     const response = await octokit.repos.getContent({
    //         owner,
    //         repo,
    //         path: ".reviewrc.json"
    //     })
    //     if("content" in response.data) {
    //         const content = Buffer.from(response.data.content, "base64" ).toString("utf-8")
    //         console.log(JSON.parse(content), "content is this <=============")
    //         return JSON.parse(content)
    //     }
        
    // }
    // catch(error) {console.log(error)}
    return {
        rules: [
        "Use clean code practices",
        "Avoid unused variables",
        "Handle errors properly",
        ],
    };
}