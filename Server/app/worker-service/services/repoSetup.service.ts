import axios from "axios";
import fs from "fs";
import path from "path";
import AdmZip from "adm-zip";
import { createAppAuth } from "@octokit/auth-app";

const ALLOWED_EXT = [".ts", ".js", ".tsx", ".jsx", ".py", ".go", ".java", ".rb", ".rs"];

async function getInstallationToken(installationId: number): Promise<string> {
  const auth = createAppAuth({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: (process.env.GITHUB_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    installationId,
  });
  const { token } = await auth({ type: "installation" });
  return token;
}

export async function downlaodRepoZIP(
  installationId: number,
  owner: string,
  repo: string
) {
  const token = await getInstallationToken(installationId);
  const url = `https://api.github.com/repos/${owner}/${repo}/zipball`;
  const zipPath = path.join("/tmp", `${owner}-${repo}.zip`);

  const response = await axios.get(url, {
    responseType: "stream",
    maxRedirects: 5,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
  });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });

  return zipPath;
}

export function extractZIP(zipPath: string): string {
  const destDir = zipPath.replace(".zip", "-extracted");
  const zip = new AdmZip(zipPath);
  zip.extractAllTo(destDir, true);
  return destDir;
}

export function readCodeFiles(dir: string) {
  const files: { path: string; content: string }[] = [];

  function walk(current: string) {
    const items = fs.readdirSync(current);

    for (const item of items) {
      const fullPath = path.join(current, item);

      if (fs.statSync(fullPath).isDirectory()) {
        if (item === "node_modules" || item === ".git" || item === "dist") {
          continue;
        }
        walk(fullPath);
      } else {
        if (ALLOWED_EXT.includes(path.extname(fullPath))) {
          const content = fs.readFileSync(fullPath, "utf-8");
          files.push({ path: fullPath, content });
        }
      }
    }
  }

  walk(dir);
  return files;
}

export function cleanup(paths: string[]) {
  for (const p of paths) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}
