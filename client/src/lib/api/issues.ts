import apiClient from "./client";

export async function applyIssueFix(issueId: string) {
  const { data } = await apiClient.post(`/api/pr/issues/${issueId}/apply-fix`);
  return data as { commitSha: string | null; explanation?: string | null; alreadyApplied?: boolean };
}
