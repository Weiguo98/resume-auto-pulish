import type { GitHubProfile } from "../../shared/api.ts";
import { normalizeSite, type Resume, type Site } from "../../shared/site.ts";
import { TEMPLATES } from "../../shared/templates/index.ts";
import { SAMPLE } from "../../shared/templates/sample.ts";

const KEYWORDS: [RegExp, string][] = [
  [/engineer|developer|software|computer/, "developer"],
  [/design|creative|market/, "creative"],
  [/manag|product|sales|business|nurse/, "modern"],
];

function fromGitHub(gh: GitHubProfile): Resume {
  return {
    ...SAMPLE,
    basics: {
      ...SAMPLE.basics,
      name: gh.name ?? gh.login,
      label: gh.bio ?? "[Your job title]",
      location: gh.location ?? SAMPLE.basics?.location,
      url: gh.blog ?? undefined,
      profiles: [{ network: "GitHub", username: gh.login, url: gh.url }],
    },
    projects: gh.repos.map((r) => ({ name: r.name, url: r.homepage ?? r.url, description: r.description ?? "", keywords: [r.language, ...r.topics].filter((k): k is string => Boolean(k)) })),
    skills: [{ name: "Languages", keywords: gh.languages.slice(0, 8) }],
  };
}

interface MockReply {
  reply: string;
  suggestions: string[];
  site: Site;
}

function mockImport(current: Site, github: GitHubProfile): MockReply {
  const site = normalizeSite({ ...current, template: "developer", content: fromGitHub(github) });
  const repos = github.repos.length;
  return {
    reply: `[Mock AI] I built your site in the Developer style. Projects and skills come from your GitHub (${repos} repos). Jobs and schools are sample data, because mock mode can't read your CV.`,
    suggestions: ["Show only my top 3 projects", "Make it dark"],
    site,
  };
}

// ponytail: keyword-matched canned replies so the UI can be tried without an API key.
export async function mockTailor(main: Site, jd: string): Promise<MockReply & { name: string }> {
  await new Promise((r) => setTimeout(r, 1000));
  const order = main.sections.order.filter((id) => id !== "projects");
  return {
    name: jd.trim().split("\n")[0].slice(0, 40) || "Tailored CV",
    reply: "[Mock AI] I moved your projects to the top and hid Education for this job. Add a real API key to get a real tailored CV.",
    suggestions: ["Make the summary shorter", "Show Education again"],
    site: normalizeSite({ ...main, sections: { order: ["projects", ...order], hidden: [...main.sections.hidden, "education"] } }),
  };
}

export async function mockChat(message: string, current: Site, github?: GitHubProfile): Promise<MockReply> {
  await new Promise((r) => setTimeout(r, 1000));
  if (github) return mockImport(current, github);
  const m = message.toLowerCase();
  const template = KEYWORDS.find(([re]) => re.test(m))?.[1] ?? current.template;
  const mode = /dark/.test(m) ? "dark" : /light/.test(m) ? "light" : current.theme.mode;
  const site = normalizeSite({
    ...current,
    template,
    theme: { ...current.theme, mode },
    content: Object.keys(current.content).length ? current.content : SAMPLE,
  });
  const name = TEMPLATES.find((t) => t.id === site.template)?.name ?? site.design?.name;
  return {
    reply: `[Mock AI] Your site uses the ${name} style. Add a real API key to get your own content.`,
    suggestions: ["Make it dark", "Make it feel more creative", "I'm a backend engineer"],
    site,
  };
}
