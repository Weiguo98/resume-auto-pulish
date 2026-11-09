import type { GitHubProfile, GitHubRepo } from "../../shared/api.ts";
import { GitHubLoginRequired } from "../errors.ts";
import { gh } from "./client.ts";

export interface ApiRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  html_url: string;
  homepage: string | null;
  pushed_at: string;
  fork: boolean;
  archived: boolean;
  private: boolean;
}

const MAX_REPOS = 8;
const MAX_README = 3000;

const own = (repos: ApiRepo[], login: string) =>
  repos.filter((r) => !r.private && !r.fork && !r.archived && r.name.toLowerCase() !== login.toLowerCase());

export function topRepos(repos: ApiRepo[], login: string): GitHubRepo[] {
  return own(repos, login)
    .sort((a, b) => b.stargazers_count - a.stargazers_count || b.pushed_at.localeCompare(a.pushed_at))
    .slice(0, MAX_REPOS)
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      topics: r.topics ?? [],
      stars: r.stargazers_count,
      url: r.html_url,
      homepage: r.homepage || null,
      pushedAt: r.pushed_at.slice(0, 7),
    }));
}

export function topLanguages(repos: ApiRepo[], login: string): string[] {
  const counts = new Map<string, number>();
  for (const r of own(repos, login)) if (r.language) counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]).map(([lang]) => lang);
}

interface ApiUser {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  html_url: string;
}

export async function readGitHubProfile(token: string): Promise<GitHubProfile> {
  const user = await gh<ApiUser>(token, "GET", "/user");
  if (user.status === 401 || !user.data) throw new GitHubLoginRequired();
  const login = user.data.login;
  const [repos, readme] = await Promise.all([
    gh<ApiRepo[]>(token, "GET", "/user/repos?visibility=public&affiliation=owner&sort=pushed&per_page=100"),
    gh<{ content?: string }>(token, "GET", `/repos/${login}/${login}/readme`),
  ]);
  const all = Array.isArray(repos.data) ? repos.data : [];
  return {
    login,
    name: user.data.name,
    bio: user.data.bio,
    company: user.data.company,
    location: user.data.location,
    blog: user.data.blog || null,
    url: user.data.html_url,
    languages: topLanguages(all, login),
    repos: topRepos(all, login),
    readme: readme.data?.content ? Buffer.from(readme.data.content, "base64").toString("utf8").slice(0, MAX_README) : null,
  };
}
