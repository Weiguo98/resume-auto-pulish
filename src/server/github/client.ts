export interface GitHubResponse<T> {
  status: number;
  data: T | null;
}

export async function gh<T = any>(token: string, method: string, path: string, body?: unknown): Promise<GitHubResponse<T>> {
  const res = await fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "folio",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, data: (await res.json().catch(() => null)) as T | null };
}
