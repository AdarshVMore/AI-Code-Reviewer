import { getOctokit } from "../../../package/github/client.js";
import { getDifferenceData, getReviewRules } from "../../../package/github/pr.js";
import {
  getAIReview,
  reviewPrompt,
  parseAIResponse,
  getReviewType,
  getCodeDiff,
  generateRelevantSearchQuery,
  createTokenAccumulator,
} from "../../../package/ai/review.js";
import { db } from "../../../package/db/prisma.js";
import {
  vectorDBExists,
  waitForVectorIndex,
  retrieveContextForDiff,
  toIndexName,
} from "./rag.service.js";
import { findGIF } from "./gif.service.js";
import { getGifName } from "../../../package/ai/gif.js";
import {
  resolveReviewApiKey,
  incrementPlatformReviewCount,
  recordTokenUsage,
} from "../../../package/lib/apiKey.service.js";
import {
  formatReviewComment,
  formatQuotaExceededComment,
  type CommentIssue,
} from "./reviewComment.format.js";

export type PRReviewJobData = {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle?: string;
  prAuthor?: string;
  userId?: string;
};

async function getReviewGifUrl(
  parsed: any,
  apiKey: string,
  usage: ReturnType<typeof createTokenAccumulator>,
): Promise<string | null> {
  try {
    const issues: any[] = parsed?.issues ?? [];
    const gifQuery = await getGifName(parsed?.summary, apiKey, usage, {
      score: parsed?.score ?? null,
      totalIssues: issues.length,
      highSeverityCount: issues.filter((i) => i.severity === "high").length,
    });
    return await findGIF(gifQuery);
  } catch (error) {
    console.error("Skipping review GIF", error);
    return null;
  }
}

async function resolveUserId(
  owner: string,
  repo: string,
  userId?: string,
): Promise<string | null> {
  if (userId) return userId;

  const repository = await db.repository.findUnique({
    where: { owner_name: { owner, name: repo } },
    select: { userId: true },
  });
  return repository?.userId ?? null;
}

export async function runPRReview(data: PRReviewJobData) {
  const { installationId, owner, repo, prNumber, prTitle, prAuthor } = data;

  const octokit = await getOctokit(installationId);
  const userId = await resolveUserId(owner, repo, data.userId);

  if (!userId) {
    console.log(`No user found for ${owner}/${repo} — skipping review`);
    return;
  }

  const resolvedKey = await resolveReviewApiKey(userId);
  if (!resolvedKey) {
    console.log(`User ${userId} has no API key and free reviews exhausted`);
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: formatQuotaExceededComment(),
    });
    return;
  }

  const { apiKey, source } = resolvedKey;
  const tokenUsage = createTokenAccumulator();

  const difference = await getDifferenceData(octokit, owner, repo, prNumber);
  const rules = await getReviewRules(octokit, owner, repo, prNumber);
  const reviewType = (await getReviewType(difference, apiKey, tokenUsage)) as any;
  const indexName = toIndexName(owner, repo);
  let relevantCode: Awaited<ReturnType<typeof retrieveContextForDiff>> | undefined;
  const processedDiff = (await getCodeDiff(difference)) as any;

  if (reviewType === "feature") {
    const indexReady =
      (await vectorDBExists(indexName)) ||
      (await waitForVectorIndex(indexName));

    if (indexReady) {
      const searchQuery = await generateRelevantSearchQuery(
        processedDiff,
        apiKey,
        tokenUsage,
      );
      relevantCode = await retrieveContextForDiff({
        diff: difference,
        semanticQuery: searchQuery,
        indexName,
        topK: 8,
      });
      console.log(
        `RAG context for ${owner}/${repo}#${prNumber}: ${relevantCode.length} AST chunks`,
      );
    } else {
      console.log(
        `Vector index "${indexName}" not ready — reviewing without RAG context`,
      );
    }
  }

  const prompt = reviewPrompt(difference, rules, relevantCode);
  const aiResponse = await getAIReview(prompt, apiKey, tokenUsage);
  const cleanText = aiResponse
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();
  const parsedPrompt = parseAIResponse(cleanText);

  if (!parsedPrompt) {
    console.log("Failed to parse AI response");
    return;
  }

  const gifUrl = await getReviewGifUrl(parsedPrompt, apiKey, tokenUsage);
  const usedCodebaseContext = Boolean(relevantCode && relevantCode.length > 0);
  const rawIssues: any[] = parsedPrompt.issues ?? [];

  const repository = await db.repository.findUnique({
    where: { owner_name: { owner, name: repo } },
  });

  let commentIssues: CommentIssue[] = rawIssues.map((issue) => ({
    id: "",
    file: issue.file,
    line: issue.line,
    severity: issue.severity,
    problem: issue.problem,
    fix: issue.fix,
  }));

  let savedReview: { id: string } | null = null;

  if (!repository) {
    console.log(
      `repo ${owner}/${repo} not found in DB after upsert — posting review without saving`,
    );
  } else {
    savedReview = await db.pRReview.create({
      data: {
        prNumber,
        prTitle: prTitle ?? null,
        summary: parsedPrompt.summary ?? null,
        score: parsedPrompt.score ?? 0,
        repositoryId: repository.id,
        author: owner,
        prAuthor: prAuthor,
        commitSHA: "",
      },
    });

    if (rawIssues.length > 0) {
      const savedIssues = await db.issue.createManyAndReturn({
        data: rawIssues.map((issue: any) => ({
          reviewId: savedReview!.id,
          file: issue.file,
          line: issue.line,
          category: issue.category,
          severity: issue.severity,
          problem: issue.problem,
          fix: issue.fix,
        })),
      });


      commentIssues = savedIssues.map((saved) => ({
        id: saved.id,
        file: saved.file,
        line: saved.line,
        severity: saved.severity,
        problem: saved.problem,
        fix: saved.fix,
      }));
    }
  }

  const commentBody = formatReviewComment(
    parsedPrompt,
    commentIssues,
    gifUrl,
    { owner, repo, prNumber },
    usedCodebaseContext,
  );
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: prNumber,
    body: commentBody,
  });

  if (!savedReview) {
    return aiResponse;
  }

  await recordTokenUsage({
    userId,
    reviewId: savedReview.id,
    inputTokens: tokenUsage.inputTokens,
    outputTokens: tokenUsage.outputTokens,
    source,
  });

  if (source === "platform") {
    await incrementPlatformReviewCount(userId);
  }

  console.log(
    `review saved to DB for ${owner}/${repo}#${prNumber} (${tokenUsage.inputTokens + tokenUsage.outputTokens} tokens, ${source})`,
  );
  return aiResponse;
}
