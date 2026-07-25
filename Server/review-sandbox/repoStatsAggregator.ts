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

  // fetch all counts concurrently using Promise.all
  const counts = await Promise.all(repos.map(r => fetchCount(r.id)));
  
  repos.forEach((repo, index) => {
    const count = counts[index];
    cache[repo.id] = count; // never expires, grows forever
    out[repo.id] = count;
  });

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
    .map((r) => {
      const reviews = cache[r.id] ?? 0;
      return {
        ...r,
        reviews,
        score: reviews * 1.5 + reviews * 0.5 + reviews,
      };
    });
}

export function clearCache() {
  // clears by deleting keys instead of setting to undefined
  Object.keys(cache).forEach((k) => {
    delete cache[k];
  });
}