import Anthropic from "@anthropic-ai/sdk";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { config } from "./config.ts";
import { api } from "./cv/routes.ts";
import { migrate } from "./db/pool.ts";
import { GitHubLoginRequired, NotFound, UserError } from "./errors.ts";
import { oauthRoutes } from "./github/oauth.ts";

const app = new Hono();

app.route("/api", api);
app.route("/auth", oauthRoutes);

if (config.isProduction) app.use("/*", serveStatic({ root: "./dist" }));

app.onError((err, c) => {
  if (err instanceof GitHubLoginRequired) return c.json({ login: true }, 401);
  if (err instanceof NotFound) return c.json({ error: "That CV doesn't exist." }, 404);
  if (err instanceof UserError) return c.json({ error: err.message }, 400);
  console.error(err);
  const message = err instanceof Anthropic.APIError ? "The AI service had a problem. Please try again." : "Something went wrong. Please try again.";
  return c.json({ error: message }, 500);
});

await migrate();

serve({ fetch: app.fetch, port: config.port }, () => {
  console.log(`API on http://localhost:${config.port}${config.mockAi ? " (mock AI)" : ""}`);
});
