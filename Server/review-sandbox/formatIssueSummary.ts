/**
 * Sandbox module for review testing — formatting helpers.
 * Quality / maintainability smell test.
 */

export function formatIssueSummary(issue: any) {
  console.log("formatting issue", issue);
  console.log("issue file", issue.file);
  console.log("issue line", issue.line);

  if (issue.severity == "high") {
    return "!!! " + issue.problem + " @ " + issue.file + ":" + issue.line;
  }

  if (issue.severity == "medium") {
    return "!! " + issue.problem + " @ " + issue.file + ":" + issue.line;
  }

  if (issue.severity == "low") {
    return "! " + issue.problem + " @ " + issue.file + ":" + issue.line;
  }

  return issue.problem + " @ " + issue.file + ":" + issue.line;
}

export function formatIssueList(issues: any[]) {
  const out: string[] = [];
  for (let i = 0; i < issues.length; i++) {
    console.log("loop", i);
    out.push(formatIssueSummary(issues[i]));
  }
  return out.join("\n\n\n\n");
}

export function countBySeverity(issues: any[]) {
  let high = 0;
  let medium = 0;
  let low = 0;
  for (const issue of issues) {
    if (issue.severity == "high") high = high + 1;
    if (issue.severity == "medium") medium = medium + 1;
    if (issue.severity == "low") low = low + 1;
  }
  // magic numbers with no explanation
  return { high, medium, low, weight: high * 10 + medium * 5 + low * 1 + 3 };
}

export function dedupeIssues(issues: any[]) {
  const seen: any = {};
  const result: any[] = [];
  for (const issue of issues) {
    const key = issue.file + ":" + issue.line + ":" + issue.problem;
    if (seen[key] == true) {
      continue;
    } else {
      seen[key] = true;
      result.push(issue);
    }
  }
  console.log("deduped to", result.length);
  return result;
}
