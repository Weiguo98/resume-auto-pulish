import type { Resume, Site } from "../../shared/site.ts";
import { config } from "../config.ts";
import { UserError } from "../errors.ts";
import { mockTailor } from "./mock.ts";
import { chat, type ChatOutput } from "./service.ts";

const MAX_JD = 20_000;

function facts(r: Resume): string[] {
  return [
    ...(r.work ?? []).map((w) => w.name || w.company),
    ...(r.education ?? []).map((e) => e.institution),
    ...(r.projects ?? []).flatMap((p) => [p.name, ...(p.keywords ?? [])]),
    ...(r.skills ?? []).flatMap((s) => s.keywords ?? []),
  ].filter((f): f is string => Boolean(f?.trim()));
}

// Tailoring may reorder and reword, but never add facts. This lists anything in the tailored CV that the main CV does not have.
export function newFacts(main: Resume, tailored: Resume): string[] {
  const known = new Set(facts(main).map((f) => f.trim().toLowerCase()));
  return [...new Set(facts(tailored).filter((f) => !known.has(f.trim().toLowerCase())))];
}

export async function tailor(main: Site, jd: string): Promise<ChatOutput> {
  if (typeof jd !== "string" || !jd.trim()) throw new UserError("Paste the job description first.");
  if (jd.length > MAX_JD) throw new UserError("That job description is too long. Paste only the main part.");
  const out = config.mockAi
    ? await mockTailor(main, jd)
    : await chat({
        site: main,
        message: `Tailor this CV for the job below.\n\nJob description:\n${jd}`,
        history: "",
        templateChosen: true,
        file: null,
        readLinks: /https?:\/\//.test(jd),
      });
  if (JSON.stringify(out.site) === JSON.stringify(main)) throw new UserError(out.reply);
  const added = newFacts(main.content, out.site.content);
  const warning = added.length ? `\n\nPlease check these. They are not in your main CV: ${added.join(", ")}.` : "";
  return { ...out, name: out.name.trim() || "Tailored CV", reply: out.reply + warning };
}
