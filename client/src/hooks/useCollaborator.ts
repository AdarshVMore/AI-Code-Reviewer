import { useState, useEffect } from "react";
import {
  fetchCollaborators,
  fetchCollaboratorAnalysis,
} from "@/lib/api/collaborators";

type Collaborator = {
  id: number;
  login: string;
  avatar_url: string;
  permissions?: {
    pull: boolean;
    push: boolean;
    admin: boolean;
  };
};

type RecentPR = {
  prTitle: string | null
  prNumber: number
  score: number | null
  issues: { category: string }[]
  createdAt: string
  _count: { issues: number }
}

export type CollaboratorAnalysis = {
  score: { _avg: { score: number | null } }
  weeklyTrend: { week: string; issues: number }[]
  monthlyTrends: { month: string; issues: number }[]
  repeatedIssues: Record<string, number>
  recentPR: RecentPR[]
}

export function useCollaborators(repoId: string) {
  const [allCollaborators, setAllCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collaboratorAnalysis, setcollaboratorAnalysis] = useState<CollaboratorAnalysis>();
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;
    fetchCollaborators(repoId)
      .then(setAllCollaborators)
      .catch(() => setError("Failed to load collaborators"))
      .finally(() => setLoading(false));
  }, [repoId]);

  async function getCollaboratorAnalysis(collaboratorName: string) {
    if (!collaboratorName) return;
    const id = repoId
    try {
      const data = (await fetchCollaboratorAnalysis(id, collaboratorName)) as CollaboratorAnalysis;
      setcollaboratorAnalysis(data);
      return data;
    } catch {
      setAnalysisError("Failed to load analysis");
    } finally {
      setAnalysisLoading(false);
    }
  }

return { 
  allCollaborators, 
  loading, 
  error,
  collaboratorAnalysis,
  analysisLoading,
  analysisError,
  getCollaboratorAnalysis 
}}
