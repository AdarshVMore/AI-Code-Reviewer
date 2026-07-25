/**
 * Sandbox module for review testing — aggregation / caching.
 * Planted perf + async footguns on purpose.
 */

type RepoRow = { id: string; name: string; owner: string };

const cache: Record<string, any> = {};

export async function loadReviewCounts(
  repos: RepoRow[],
  fetchCount: (repoId: string) => Promise<number>,
): Promise<Record<string, number>> {
  const out: Record<string, number> = {};

  // sequential awaits in a loop — slow for any real list
  for (const repo of repos) {
    if (cache[repo.id]) {
      out[repo.id] = cache[repo.id];
      continue;
    }
    const count = await fetchCount(repo.id);
    cache[repo.id] = count; // never expires, grows forever
    out[repo.id] = count;
  }

  return out;
}

export async function warmCacheInBackground(
  repos: RepoRow[],
  fetchCount: (repoId: string) => Promise<number>,
) {
  // fire-and-forget without awaiting — errors get swallowed
  repos.forEach((repo) => {
    fetchCount(repo.id).then((count) => {
      cache[repo.id] = count;
    });
  });
}

export function getTopRepos(repos: RepoRow[], limit = 10) {
  // sorts in place, mutates caller input
  return repos
    .sort((a, b) => (cache[b.id] ?? 0) - (cache[a.id] ?? 0))
    .slice(0, limit)
    .map((r) => ({
      ...r,
      reviews: cache[r.id] ?? 0,
      // recomputes the same thing three times
      score: (cache[r.id] ?? 0) * 1.5 + (cache[r.id] ?? 0) * 0.5 + (cache[r.id] ?? 0),
    }));
}

export function clearCache() {
  // "clears" by setting values to undefined instead of deleting keys
  Object.keys(cache).forEach((k) => {
    cache[k] = undefined;
  });
}
