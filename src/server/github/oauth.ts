import { randomBytes } from "node:crypto";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { config } from "../config.ts";
import { deleteSession, linkGitHub } from "../cv/store.ts";
import { SESSION_COOKIE, session, type Env } from "../session.ts";
import { gh } from "./client.ts";

const STATE_COOKIE = "oauth_state";
const cookieOptions = { httpOnly: true, sameSite: "Lax", path: "/" } as const;
const RETURN_TO = ["publish", "github"];

export const oauthRoutes = new Hono<Env>();

oauthRoutes.use(session);

oauthRoutes.get("/github", (c) => {
  const then = c.req.query("then") ?? "";
  const state = randomBytes(16).toString("hex") + (RETURN_TO.includes(then) ? `.${then}` : "");
  setCookie(c, STATE_COOKIE, state, cookieOptions);
  const params = new URLSearchParams({
    client_id: config.github.clientId,
    scope: "repo",
    state,
    redirect_uri: `${config.baseUrl}/auth/github/callback`,
  });
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

oauthRoutes.get("/github/callback", async (c) => {
  const state = c.req.query("state");
  if (!state || state !== getCookie(c, STATE_COOKIE)) {
    return c.json({ error: "Login check failed. Please try again." }, 400);
  }
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.github.clientId, client_secret: config.github.clientSecret, code: c.req.query("code") }),
  });
  const { access_token: token } = (await res.json()) as { access_token?: string };
  const user = token ? await gh<{ id: number; login: string }>(token, "GET", "/user") : null;
  if (!token || !user?.data?.id) return c.json({ error: "GitHub login did not finish. Please try again." }, 400);
  // ponytail: the GitHub token is stored as plain text in Postgres; encrypt it with a server key before real users.
  await linkGitHub(c.get("sessionId"), c.get("userId"), { id: user.data.id, login: user.data.login, token });
  const then = state.split(".")[1];
  return c.redirect(then ? `/?${then}=1` : "/");
});

oauthRoutes.post("/logout", async (c) => {
  await deleteSession(c.get("sessionId"));
  deleteCookie(c, SESSION_COOKIE, { path: "/" });
  return c.body(null, 204);
});
