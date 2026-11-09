import type { PublishResponse } from "../../shared/api.ts";
import { GitHubLoginRequired, UserError } from "../errors.ts";
import { gh } from "./client.ts";

const REPO_MARK = "Personal site made with Folio";

interface Repo {
  name: string;
  description: string | null;
  default_branch: string;
  html_url: string;
}

async function findOrCreateSiteRepo(token: string, login: string): Promise<Repo> {
  for (const name of [`${login}.github.io`, "resume"]) {
    const found = await gh<Repo>(token, "GET", `/repos/${login}/${name}`);
    if (found.status === 404) {
      const created = await gh<Repo & { message?: string }>(token, "POST", "/user/repos", { name, description: REPO_MARK, auto_init: true });
      if (created.status !== 201 || !created.data) throw new UserError(`GitHub did not create the repo: ${created.data?.message}`);
      return created.data;
    }
    if (found.data?.description === REPO_MARK) return found.data;
  }
  throw new UserError(`You already have repos named ${login}.github.io and resume. Rename one of them and try again.`);
}

export async function publishSite(token: string, html: string, dir = ""): Promise<PublishResponse> {
  const user = await gh<{ login: string }>(token, "GET", "/user");
  if (user.status === 401 || !user.data) throw new GitHubLoginRequired();
  const login = user.data.login;
  const repo = await findOrCreateSiteRepo(token, login);

  const filePath = `/repos/${login}/${repo.name}/contents/${dir ? `${dir}/` : ""}index.html`;
  const existing = await gh<{ sha: string }>(token, "GET", filePath);
  const put = await gh<{ message?: string }>(token, "PUT", filePath, {
    message: dir ? `Update ${dir}` : "Update site",
    content: Buffer.from(html).toString("base64"),
    sha: existing.data?.sha,
  });
  if (put.status >= 300) throw new UserError(`GitHub did not save the page: ${put.data?.message}`);

  const pages = await gh<{ message?: string }>(token, "POST", `/repos/${login}/${repo.name}/pages`, {
    source: { branch: repo.default_branch, path: "/" },
  });
  if (pages.status >= 300 && pages.status !== 409) throw new UserError(`GitHub Pages did not turn on: ${pages.data?.message}`);

  const host = `${login.toLowerCase()}.github.io`;
  const url = repo.name.toLowerCase() === host ? `https://${host}/` : `https://${host}/${repo.name}/`;
  return { url: dir ? `${url}${dir}/` : url, repo: repo.html_url };
}
