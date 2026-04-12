import { useState, useEffect } from "react";
import { fetchDeployments } from "@/lib/api/deployments";

export type DeploymentFix = {
  id: string;
  status: string;
  commitSha: string | null;
  diff: string | null;
  createdAt: string;
};

export type Deployment = {
  id: string;
  provider: string;
  status: string;
  deploymentId: string;
  prNumber: number | null;
  branch: string | null;
  cause: string | null;
  fix: string | null;
  createdAt: string;
  fixes: DeploymentFix[];
};

export function useDeployments(repoId: string) {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!repoId) return;
    fetchDeployments(repoId)
      .then(setDeployments)
      .catch(() => setError("Failed to load deployments"))
      .finally(() => setLoading(false));
  }, [repoId]);

  return { deployments, loading, error, setDeployments };
}
