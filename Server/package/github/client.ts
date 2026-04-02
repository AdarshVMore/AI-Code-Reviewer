import { App } from "@octokit/app";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
});

export async function getOctokit(installationId: number) {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
installationId,
  })
  const InstallationAuth = await auth({
    type: "installation"
  })
  const octoKit = new Octokit({
    auth: InstallationAuth.token
  })

  return octoKit
}
