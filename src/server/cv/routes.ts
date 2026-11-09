import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { ChatRequest, NewVersionRequest, PublishResponse, TailorRequest, TailorResponse } from "../../shared/api.ts";
import { normalizeSite } from "../../shared/site.ts";
import { renderSite } from "../../shared/templates/index.ts";
import { chat } from "../chat/service.ts";
import { tailor } from "../chat/tailor.ts";
import { GitHubLoginRequired, UserError } from "../errors.ts";
import { readGitHubProfile } from "../github/profile.ts";
import { publishSite } from "../github/publish.ts";
import { htmlToPdf } from "../pdf.ts";
import { session, type Env } from "../session.ts";
import * as store from "./store.ts";

const HISTORY_TURNS = 3;

const latestVersion = async (cvId: string) => (await store.recentVersions(cvId, 1))[0] ?? null;

const limit = bodyLimit({
  maxSize: 25 * 1024 * 1024,
  onError: (c) => c.json({ error: "That file is too big. Try a file under 15 MB." }, 413),
});

async function gitHubToken(userId: string): Promise<string> {
  const { token } = await store.gitHubAccount(userId);
  if (!token) throw new GitHubLoginRequired();
  return token;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "cv";

export const api = new Hono<Env>();

api.use(session);

api.get("/me", async (c) => c.json({ login: (await store.gitHubAccount(c.get("userId"))).login }));

api.get("/github/profile", async (c) => c.json(await readGitHubProfile(await gitHubToken(c.get("userId")))));

api.get("/cvs", async (c) => c.json(await store.listCvs(c.get("userId"))));

api.delete("/cvs/:id", async (c) => {
  await store.deleteVariant(c.get("userId"), c.req.param("id"));
  return c.body(null, 204);
});

api.get("/cvs/:id/versions", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  return c.json(await store.listVersions(cv.id));
});

api.post("/cvs/:id/versions", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  const body = await c.req.json<NewVersionRequest>();
  return c.json(await store.addVersion(cv.id, { message: body.message, reply: body.reply, suggestions: [], site: normalizeSite(body.site) }));
});

api.post("/cvs/:id/new-chat", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  const latest = await latestVersion(cv.id);
  if (!latest) throw new UserError("There is no chat to clear yet.");
  return c.json(
    await store.addVersion(cv.id, {
      message: "Start a new chat",
      reply: "New chat. Your site stays as it is. What would you like to change?",
      suggestions: latest.suggestions,
      site: latest.site,
      startsChat: true,
    }),
  );
});

api.delete("/cvs/:id/versions/last", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  await store.deleteLastVersion(cv.id);
  return c.body(null, 204);
});

api.post("/cvs/:id/chat", limit, async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  const req = await c.req.json<ChatRequest>();
  const recent = await store.recentVersions(cv.id, HISTORY_TURNS);
  const current = recent.at(-1)?.site ?? normalizeSite({ template: req.draftTemplate });
  const turns = recent.slice(recent.findLastIndex((v) => v.startsChat) + 1);
  const out = await chat({
    site: current,
    message: req.message,
    history: turns.map((v) => `User: ${v.message}\nYou: ${v.reply}`).join("\n"),
    templateChosen: recent.length > 0 || Boolean(req.templateChosen),
    file: req.file ?? null,
    github: req.github,
    jd: cv.jd,
  });
  return c.json(await store.addVersion(cv.id, { message: req.message, file: req.file?.name, reply: out.reply, suggestions: out.suggestions, site: out.site }));
});

api.post("/cvs/tailor", async (c) => {
  const userId = c.get("userId");
  const { jd } = await c.req.json<TailorRequest>();
  const main = await store.mainCv(userId);
  const base = await latestVersion(main.id);
  if (!base) throw new UserError("Build your main CV first. Then you can tailor it for a job.");
  const out = await tailor(base.site, jd);
  const created = await store.createVariant(userId, main.id, out.name, jd.trim(), base.id, {
    message: "Tailor my CV for this job",
    reply: out.reply,
    suggestions: out.suggestions,
    site: out.site,
  });
  return c.json<TailorResponse>(created);
});

api.post("/cvs/:id/retailor", async (c) => {
  const userId = c.get("userId");
  const cv = await store.getCv(userId, c.req.param("id"));
  if (cv.kind !== "variant" || !cv.jd || !cv.parentId) throw new UserError("Only a tailored CV can be tailored again.");
  const base = await latestVersion(cv.parentId);
  if (!base) throw new UserError("Your main CV is empty.");
  const out = await tailor(base.site, cv.jd);
  return c.json(
    await store.retailored(cv.id, base.id, {
      message: "Tailor again from my updated main CV",
      reply: out.reply,
      suggestions: out.suggestions,
      site: out.site,
    }),
  );
});

api.post("/cvs/:id/publish", async (c) => {
  const userId = c.get("userId");
  const cv = await store.getCv(userId, c.req.param("id"));
  const latest = await latestVersion(cv.id);
  if (!latest) throw new UserError("There is nothing to publish yet.");
  const dir = cv.kind === "main" ? "" : `jobs/${slug(cv.name)}-${cv.id.slice(0, 6)}`;
  const published = await publishSite(await gitHubToken(userId), renderSite(latest.site), dir);
  await store.addPublish(cv.id, latest, published.url, published.repo);
  return c.json<PublishResponse>(published);
});

api.get("/cvs/:id/pdf", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  const latest = await latestVersion(cv.id);
  if (!latest) throw new UserError("There is nothing to download yet.");
  const name = latest.site.content.basics?.name || "cv";
  const pdf = await htmlToPdf(renderSite(latest.site));
  return c.body(pdf, 200, {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${slug(cv.kind === "main" ? name : `${name} ${cv.name}`)}.pdf"`,
  });
});

api.get("/cvs/:id/publishes", async (c) => {
  const cv = await store.getCv(c.get("userId"), c.req.param("id"));
  return c.json(await store.listPublishes(cv.id));
});
