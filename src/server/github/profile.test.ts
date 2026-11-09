import { test } from "node:test";
import assert from "node:assert/strict";
import { topLanguages, topRepos, type ApiRepo } from "./profile.ts";

const repo = (name: string, stars: number, extra: Partial<ApiRepo> = {}): ApiRepo => ({
  name,
  description: null,
  language: "Go",
  stargazers_count: stars,
  html_url: `https://github.com/me/${name}`,
  homepage: "",
  pushed_at: "2026-01-01T00:00:00Z",
  fork: false,
  archived: false,
  private: false,
  ...extra,
});

test("topRepos keeps only your public, active repos, most starred first", () => {
  const repos = [
    repo("small", 1),
    repo("big", 50),
    repo("forked", 900, { fork: true }),
    repo("secret", 900, { private: true }),
    repo("old", 900, { archived: true }),
    repo("me", 900),
    repo("recent", 1, { pushed_at: "2026-06-01T00:00:00Z" }),
  ];
  assert.deepEqual(
    topRepos(repos, "Me").map((r) => r.name),
    ["big", "recent", "small"],
  );
});

test("topLanguages ranks by repo count and skips private repos", () => {
  const repos = [
    repo("a", 0, { language: "Python" }),
    repo("b", 0, { language: "Go" }),
    repo("c", 0, { language: "Go" }),
    repo("d", 0, { language: "Rust", private: true }),
    repo("e", 0, { language: null }),
  ];
  assert.deepEqual(topLanguages(repos, "me"), ["Go", "Python"]);
});
