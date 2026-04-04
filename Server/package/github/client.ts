import { App } from "@octokit/app";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const rawKey = process.env.GITHUB_PRIVATE_KEY ?? ""
const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: rawKey.replace(/\\n/g, "\n"),
});

export async function getOctokit(installationId: number) {
  let privateKey = process.env.GITHUB_PRIVATE_KEY!
  if(privateKey) {
    privateKey = privateKey.replace(/\\n/g, "\n")
  }
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: privateKey,
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
