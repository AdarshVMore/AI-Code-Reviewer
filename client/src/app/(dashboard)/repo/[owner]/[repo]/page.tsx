"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, SectionLabel, Avatar } from "@/components/ui";
import { Topbar } from "@/components/layout/Topbar";
import { useRepos } from "@/hooks/useRepos";
import { useAllPRs } from "@/hooks/useAllPRs";
import { useCollaborators } from "@/hooks/useCollaborator";
import type { CollaboratorAnalysis } from "@/hooks/useCollaborator";
import { useDeployments, Deployment } from "@/hooks/useDeployments";
import { fixDeployment } from "@/lib/api/deployments";
import { fetchRepoSettings, updateRepoSettings } from "@/lib/api/repos";
import ToggleSwitch from "@/components/ui/ToggleSwitch";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-bg-raised border border-bg-border rounded-lg px-3 py-2 text-xs font-mono text-text-primary">
      {label}: {payload[0].value}
    </div>
  );
}

type TabId =
  | "reviews"
  | "analytics"
  | "collaborators"
  | "settings"
  | "deployment";

const tabs: { id: TabId; label: string }[] = [
  { id: "reviews", label: "Reviews" },
  { id: "analytics", label: "Analytics" },
  { id: "collaborators", label: "Team Analysis" },
  { id: "deployment", label: "deployment" },
  { id: "settings", label: "Settings" },
];

const categoryData = [
  { category: "Security", count: 31 },
  { category: "Error handling", count: 24 },
  { category: "Code quality", count: 18 },
  { category: "Performance", count: 12 },
  { category: "Types", count: 7 },
];

const ISSUE_TYPE_COLORS: Record<string, string> = {
  Security: "bg-red-400/10 text-red-400 border-red-400/20",
  "Error handling": "bg-amber-400/10 text-amber-400 border-amber-400/20",
  "Code quality": "bg-blue-400/10 text-blue-400 border-blue-400/20",
  Performance: "bg-purple-400/10 text-purple-400 border-purple-400/20",
  Types: "bg-green-400/10 text-green-400 border-green-400/20",
};

type TeamMember = {
  login: string;
  avatar_url: string;
};

export default function RepoPage() {
  const params = useParams();
  const router = useRouter();
  const owner = params.owner as string;
  const repo = params.repo as string;

  const [activeTab, setActiveTab] = useState<TabId>("reviews");
  const [allowGif, setAllowGif] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [autoComment, setAutoComment] = useState(true);
  const [selectedReviewer, setSelectedReviewer] = useState("none");
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  const { repos } = useRepos();
  const currentRepo = repos.find((r) => r.owner === owner && r.name === repo);
  const repoId = currentRepo?.id ?? "";

  const { prs, loading } = useAllPRs(repoId);
  const {
    allCollaborators,
    collaboratorAnalysis,
    analysisLoading,
    getCollaboratorAnalysis,
  } = useCollaborators(repoId);
  console.log("allCollaborator======>", allCollaborators);
  const {
    deployments,
    loading: deploymentsLoading,
    setDeployments,
  } = useDeployments(repoId);
  const [fixingId, setFixingId] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (!repoId) return;
    fetchRepoSettings(repoId).then((s) => {
      setAllowGif(s.allowGif ?? false);
      setStrictMode(s.strictMode ?? false);
      setAutoComment(s.autoComment ?? true);
      setSelectedReviewer(s.reviewer || "none");
    }).catch(() => {});
  }, [repoId]);

  async function handleSaveSettings() {
    if (!repoId) return;
    setSettingsSaving(true);
    try {
      await updateRepoSettings(repoId, {
        allowGif,
        strictMode,
        autoComment,
        reviewer: selectedReviewer === "none" ? "" : selectedReviewer,
      });
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2500);
    } finally {
      setSettingsSaving(false);
    }
  }

  const reviewsData = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const pr of prs) {
      const date = new Date(pr.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      });
      counts[date] = (counts[date] ?? 0) + 1;
    }
    return Object.entries(counts).map(([date, count]) => ({ date, count }));
  }, [prs]);

  async function handleFix(deployment: Deployment) {
    setFixingId(deployment.id);
    try {
      const result = await fixDeployment(deployment.id);
      setDeployments((prev) =>
        prev.map((d) =>
          d.id === deployment.id
            ? {
                ...d,
                fixes: [
                  ...d.fixes,
                  {
                    id: Date.now().toString(),
                    status: "applied",
                    commitSha: result.commitSha,
                    diff: result.diff,
                    createdAt: new Date().toISOString(),
                  },
                ],
              }
            : d,
        ),
      );
    } catch {
      alert("Failed to apply fix");
    } finally {
      setFixingId(null);
    }
  }

  return (
    <>
      <Topbar
        title={`${owner}/${repo}`}
        subtitle={`${prs.length} PRs reviewed`}
      />
      <div className="px-8 py-7 max-w-7xl mx-auto">
        <div className="flex border-b border-bg-border mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-sm px-4 py-2.5 font-medium cursor-pointer transition-colors duration-150 bg-transparent border-none ${
                activeTab === tab.id
                  ? "text-text-primary border-b-2 border-brand -mb-px"
                  : "text-text-secondary hover:text-text-primary"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "reviews" && (
          <>
            {loading && (
              <p className="text-sm text-text-secondary">Loading...</p>
            )}
            {!loading && prs.length === 0 && (
              <p className="text-sm text-text-secondary">
                No PRs reviewed yet.
              </p>
            )}
            {prs.map((pr) => (
              <Card
                key={pr.id}
                hoverable
                className="mb-3 p-4"
                onClick={() =>
                  router.push(`/repo/${owner}/${repo}/pr/${pr.prNumber}`)
                }
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary truncate">
                      {pr.prTitle ?? `PR #${pr.prNumber}`}
                    </p>
                    <p className="text-xs font-mono text-text-secondary mt-0.5">
                      {owner}/{repo} · PR #{pr.prNumber}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-text-tertiary">
                      {timeAgo(pr.createdAt)}
                    </span>
                  </div>
                </div>
                {pr.summary && (
                  <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                    {pr.summary}
                  </p>
                )}
              </Card>
            ))}
          </>
        )}

        {activeTab === "analytics" && (
          <div>
            <SectionLabel>Reviews over time</SectionLabel>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={reviewsData}>
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#555555", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#555555", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <CartesianGrid stroke="#262626" vertical={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#5b6af0"
                  strokeWidth={1.5}
                  fill="#5b6af0"
                  fillOpacity={0.08}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>

            
          </div>
        )}

        {activeTab === "collaborators" && (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              {allCollaborators.map((m) => (
                <button
                  key={m.login}
                  onClick={() => {
                    setSelectedMember(selectedMember?.login === m.login ? null : m)
                    if (selectedMember?.login !== m.login) getCollaboratorAnalysis(m.login)
                  }}
                  className={`text-left rounded-xl border p-4 transition-all duration-150 cursor-pointer ${
                    selectedMember?.login === m.login
                      ? "border-brand bg-brand/5"
                      : "border-bg-border bg-bg-raised hover:border-brand/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={m.avatar_url} username={m.login} size="sm" />
                    <span className="text-sm font-mono font-medium text-text-primary">{m.login}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedMember && (
              <div className="rounded-xl border border-bg-border bg-bg-raised p-5 space-y-6">
                {analysisLoading && !collaboratorAnalysis && (
                  <p className="text-sm text-text-secondary">Loading analysis...</p>
                )}
                {collaboratorAnalysis && (() => {
                  const analysis = collaboratorAnalysis as CollaboratorAnalysis
                  const avgScore = analysis.score._avg.score
                  const repeatedEntries = Object.entries(analysis.repeatedIssues)
                  const maxCount = Math.max(...repeatedEntries.map(([, c]) => c), 1)

                  return (
                    <>
                      <div className="flex items-center gap-3">
                        <Avatar src={selectedMember.avatar_url} username={selectedMember.login} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text-primary font-mono">{selectedMember.login}</p>
                          <p className="text-xs text-text-tertiary">
                            {analysis.recentPR.length} PRs reviewed · avg score
                            <span className={`font-bold text-white text-xl ml-2`}>
                              {avgScore ?? "—"} / 100
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-3">Issues over time</p>
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={analysis.monthlyTrends}>
                              <XAxis dataKey="month" tick={{ fill: "#555555", fontSize: 10 }} axisLine={false} tickLine={false} />
                              <YAxis tick={{ fill: "#555555", fontSize: 10 }} axisLine={false} tickLine={false} width={24} />
                              <CartesianGrid stroke="#262626" vertical={false} />
                              <Tooltip content={<CustomTooltip />} />
                              <Line type="monotone" dataKey="issues" stroke="#5b6af0" strokeWidth={2} dot={{ r: 3, fill: "#5b6af0" }} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>

                        <div>
                          <p className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-3">Repeated issues</p>
                          <div className="space-y-2">
                            {repeatedEntries.map(([type, count]) => (
                              <div key={type} className="flex items-center gap-3">
                                <span className={`text-xs font-mono px-2 py-0.5 rounded-full border shrink-0 ${ISSUE_TYPE_COLORS[type] ?? "bg-bg-border text-text-secondary border-bg-border"}`}>
                                  {type}
                                </span>
                                <div className="flex-1 h-1.5 rounded-full bg-bg-border overflow-hidden">
                                  <div className="h-full rounded-full bg-brand/60" style={{ width: `${(count / maxCount) * 100}%` }} />
                                </div>
                                <span className="text-xs font-mono text-text-tertiary w-4 text-right">{count}x</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-3">Recent reviews</p>
                        <div className="space-y-2">
                          {analysis.recentPR.map((pr) => {
                            const uniqueCategories = [...new Set(pr.issues.map((i) => i.category))]
                            return (
                              <div key={pr.prNumber} className="flex items-start justify-between gap-3 py-2 border-b border-bg-border last:border-0">
                                <div className="min-w-0">
                                  <p className="text-sm text-text-primary truncate">{pr.prTitle ?? `PR #${pr.prNumber}`}</p>
                                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                    <span className="text-xs font-mono text-text-tertiary">#{pr.prNumber} · {timeAgo(pr.createdAt)}</span>
                                    {uniqueCategories.map((t) => (
                                      <span key={t} className={`text-xs font-mono px-1.5 py-0 rounded border ${ISSUE_TYPE_COLORS[t] ?? "bg-bg-border text-text-secondary border-bg-border"}`}>
                                        {t}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <span className={`text-sm font-semibold font-mono shrink-0 text-white`}>
                                  {pr.score ?? "—"} / 100
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </>
                  )
                })()}
              </div>
            )}
          </div>
        )}

        {activeTab === "deployment" && (
          <div>
            {deploymentsLoading && (
              <p className="text-sm text-text-secondary">Loading...</p>
            )}
            {!deploymentsLoading && deployments.length === 0 && (
              <p className="text-sm text-text-secondary">
                No deployments tracked yet.
              </p>
            )}
            {deployments.map((d) => {
              const appliedFix = d.fixes.find((f) => f.status === "applied");
              const isFixing = fixingId === d.id;
              return (
                <Card key={d.id} className="mb-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 mt-1 ${d.status === "failed" ? "bg-red-400" : d.status === "success" ? "bg-green-400" : "bg-amber-400"}`}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-bg-raised border border-bg-border text-text-secondary capitalize">
                            {d.provider.replace("_", " ")}
                          </span>
                          {d.branch && (
                            <span className="text-xs font-mono text-text-tertiary">
                              {d.branch}
                            </span>
                          )}
                          {d.prNumber && (
                            <span className="text-xs font-mono text-text-tertiary">
                              PR #{d.prNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-mono text-text-tertiary mt-1">
                          {new Date(d.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {d.status === "failed" && !appliedFix && (
                        <button
                          onClick={() => handleFix(d)}
                          disabled={isFixing}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isFixing ? "Fixing..." : "Fix the issue"}
                        </button>
                      )}
                      {appliedFix && appliedFix.commitSha && (
                        <span className="text-xs font-mono text-green-400">
                          Fixed · {appliedFix.commitSha.slice(0, 7)}
                        </span>
                      )}
                    </div>
                  </div>
                  {d.cause && (
                    <div className="mt-3 pt-3 border-t border-bg-border">
                      <p className="text-xs font-mono text-text-tertiary mb-1">
                        Cause
                      </p>
                      <p className="text-sm text-text-secondary">{d.cause}</p>
                    </div>
                  )}
                  {d.fix && (
                    <div className="mt-2">
                      <p className="text-xs font-mono text-text-tertiary mb-1">
                        Suggested fix
                      </p>
                      <p className="text-sm text-text-secondary">{d.fix}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}

{activeTab === "settings" && (
          <div className="max-w-xl">
            <div className="rounded-xl border border-bg-border bg-bg-raised p-5 mb-4">
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-2">Review behaviour</p>
              <ToggleSwitch
                label="Allow GIF in Review"
                description="Include a reaction GIF in the AI review comment"
                checked={allowGif}
                onChange={setAllowGif}
              />
              <ToggleSwitch
                label="Strict Mode"
                description="Flag low-severity issues that would normally be skipped"
                checked={strictMode}
                onChange={setStrictMode}
              />
              <ToggleSwitch
                label="Auto-comment on PR"
                description="Post the review comment automatically without manual approval"
                checked={autoComment}
                onChange={setAutoComment}
              />
            </div>

            <div className="rounded-xl border border-bg-border bg-bg-raised p-5">
              <p className="text-xs font-mono text-text-tertiary uppercase tracking-wide mb-3">Reviewer</p>
              <div className="flex items-center justify-between gap-6">
                <div>
                  <p className="text-sm font-medium text-text-primary">Select reviewer</p>
                  <p className="text-xs text-text-tertiary mt-0.5">Assign a team member to be notified on each review</p>
                </div>
                <select
                  value={selectedReviewer}
                  onChange={(e) => setSelectedReviewer(e.target.value)}
                  className="bg-bg-surface border border-bg-border text-text-primary text-sm rounded-lg px-3 py-1.5 font-mono focus:outline-none focus:border-brand transition-colors shrink-0"
                >
                  <option value="none">None</option>
                  {allCollaborators.map((c) => (
                    <option key={c.login} value={c.login}>{c.login}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleSaveSettings}
                disabled={settingsSaving}
                className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {settingsSaving ? "Saving..." : "Save settings"}
              </button>
              {settingsSaved && (
                <span className="text-xs font-mono text-green-400">Saved</span>
              )}
            </div>
          </div>
        )}      </div>
    </>
  );
}
