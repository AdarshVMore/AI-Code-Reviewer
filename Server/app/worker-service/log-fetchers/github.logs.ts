import { getOctokit } from "../../../package/github/client.js";
import AdmZip from "adm-zip";

export async function fetchGithubActionLogs(installationId: number, owner: string, repo: string, runId: number) {
  const octokit = await getOctokit(installationId);

  const response = await octokit.rest.actions.downloadWorkflowRunLogs({
    owner,
    repo,
    run_id: runId,
  });

  const buffer = Buffer.from(response.data as ArrayBuffer);
  // here buffer is like a bunch of alphaNumbers like <Buffer 50 4b 03 04 14 00 08 00 ...>
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  // here this entries return folders and files with extension like [ ZipEntry, ZipEntry, ZipEntry]
 
  let logs = "";
  for (const entry of entries) {
    if (!entry.isDirectory) {
      logs += `\n--- ${entry.entryName} ---\n`;
      logs += zip.readAsText(entry);
    }
  }

  return logs.slice(0, 20000);
}
