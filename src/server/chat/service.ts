import type { Attachment, GitHubProfile } from "../../shared/api.ts";
import { normalizeSite, type Site } from "../../shared/site.ts";
import { config } from "../config.ts";
import { UserError } from "../errors.ts";
import { askClaude } from "./claude.ts";
import { mockChat } from "./mock.ts";
import { userTurn } from "./prompt.ts";

const MAX_GITHUB_JSON = 40_000;

function gitHubText(github?: GitHubProfile): string {
  if (!github) return "";
  const json = JSON.stringify(github);
  if (json.length > MAX_GITHUB_JSON) throw new UserError("Your GitHub data is too large to read. Please try again.");
  return `\n\nGitHub profile data (public repos only):\n${json}`;
}

export interface ChatInput {
  site: Site;
  message: string;
  history: string;
  templateChosen: boolean;
  file: Attachment | null;
  github?: GitHubProfile;
  jd?: string | null;
  readLinks?: boolean;
}

export interface ChatOutput {
  reply: string;
  suggestions: string[];
  site: Site;
  name: string;
}

export async function chat(input: ChatInput): Promise<ChatOutput> {
  if (typeof input.message !== "string" || !input.message.trim()) throw new UserError("Please type a message.");
  const current = input.site;
  const extra = gitHubText(input.github);
  if (config.mockAi) return { ...(await mockChat(input.message, current, input.github)), name: "" };

  const turn = userTurn(current, input.message, input.history, input.templateChosen, input.jd) + extra;
  const out = await askClaude(turn, input.file, input.readLinks);
  let site = current;
  if (out.site_json) {
    try {
      site = normalizeSite(JSON.parse(out.site_json));
    } catch {
      throw new UserError("Something went wrong while updating your site. Please try again.");
    }
  }
  return { reply: out.reply, suggestions: out.suggestions ?? [], site, name: out.cv_name ?? "" };
}
