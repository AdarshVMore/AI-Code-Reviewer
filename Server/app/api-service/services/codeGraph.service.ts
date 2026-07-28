export type CodeGraphNode = {
  id: string;
  label: string;
  fullPath?: string;
  type: "repo" | "file";
  issueCount: number;
  severity: "none" | "high" | "medium" | "low";
  categories?: string[];
};

export type CodeGraphEdge = {
  id: string;
  source: string;
  target: string;
};

type IssueRow = { file: string; severity: string; category: string };

export function buildCodeGraphLite(
  repo: { owner: string; name: string },
  issues: IssueRow[],
): { nodes: CodeGraphNode[]; edges: CodeGraphEdge[] } {
  type FileStats = { count: number; high: number; medium: number; low: number; categories: Set<string> };
  const fileMap = new Map<string, FileStats>();

  for (const issue of issues) {
    const entry = fileMap.get(issue.file) ?? { count: 0, high: 0, medium: 0, low: 0, categories: new Set<string>() };
    entry.count += 1;
    if (issue.severity === "high") entry.high += 1;
    else if (issue.severity === "medium") entry.medium += 1;
    else entry.low += 1;
    entry.categories.add(issue.category);
    fileMap.set(issue.file, entry);
  }

  const rootId = "__repo_root__";
  const nodes: CodeGraphNode[] = [
    { id: rootId, label: `${repo.owner}/${repo.name}`, type: "repo", issueCount: issues.length, severity: "none" },
    ...Array.from(fileMap.entries()).map(([file, stats]) => ({
      id: file,
      label: file.split("/").pop() ?? file,
      fullPath: file,
      type: "file" as const,
      issueCount: stats.count,
      severity: (stats.high > 0 ? "high" : stats.medium > 0 ? "medium" : "low") as "high" | "medium" | "low",
      categories: Array.from(stats.categories),
    })),
  ];

  const edges: CodeGraphEdge[] = Array.from(fileMap.keys()).map((file) => ({
    id: `${rootId}->${file}`,
    source: rootId,
    target: file,
  }));

  return { nodes, edges };
}
