import { getCookie, setCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import { newSession, userForSession } from "./cv/store.ts";

export const SESSION_COOKIE = "sid";

export type Env = { Variables: { userId: string; sessionId: string } };

// Every browser gets a user on its first API call, so work is saved before GitHub login. Login later merges it into the GitHub user.
// ponytail: anonymous users are never cleaned up; add a job that deletes empty ones if the table grows.
export const session = createMiddleware<Env>(async (c, next) => {
  const sid = getCookie(c, SESSION_COOKIE);
  let userId = sid ? await userForSession(sid) : null;
  let sessionId = sid ?? "";
  if (!userId) {
    const created = await newSession();
    ({ id: sessionId, userId } = created);
    setCookie(c, SESSION_COOKIE, sessionId, { httpOnly: true, sameSite: "Lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  }
  c.set("userId", userId);
  c.set("sessionId", sessionId);
  await next();
});
