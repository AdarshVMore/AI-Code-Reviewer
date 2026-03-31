import { App } from "@octokit/app";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";

const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
});

export async function getOctokit(installationId: number) {
  console.log(installationId, "<======= installation id")
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
      privateKey: process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n"),
installationId,
  })
  console.log("pass1" , auth)
  const InstallationAuth = await auth({
    type: "installation"
  })
  console.log("pass2", InstallationAuth)
  const octoKit = new Octokit({
    auth: InstallationAuth.token
  })

  console.log("pass3", octoKit)

  return octoKit
}