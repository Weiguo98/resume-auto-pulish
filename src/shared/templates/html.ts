import type { Font, Mode, Resume, SectionId, Site } from "../site.ts";

export interface ThemeDefaults {
  accent: string;
  font: Font;
  mode: Mode;
}

const FONTS: Record<Font, { family: string; spec: string }> = {
  sans: { family: "Inter", spec: "Inter:wght@400;500;700;800" },
  serif: { family: "Fraunces", spec: "Fraunces:opsz,wght@9..144,400;9..144,600;9..144,800" },
  mono: { family: "JetBrains Mono", spec: "JetBrains+Mono:wght@400;600;800" },
};

const MODES: Record<Mode, string> = {
  light: "--bg:#ffffff;--ink:#1c1c1a;--muted:#62615c;--line:#e6e4de;--card:#f6f5f1;",
  dark: "--bg:#121417;--ink:#e8e6e1;--muted:#9a9891;--line:#2a2d31;--card:#1a1d21;",
};

const TITLES: Record<SectionId, string> = {
  about: "About",
  work: "Experience",
  projects: "Projects",
  education: "Education",
  skills: "Skills",
};

const BASE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);font-family:var(--font);line-height:1.55;font-size:16px;-webkit-text-size-adjust:100%}
a{color:var(--accent)}
h1,h2,h3{line-height:1.2;margin:0}
p{margin:.4em 0}
ul{margin:.4em 0;padding-left:1.2em}
.contact{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:.4em 1.2em;color:var(--muted)}
.contact a{color:inherit}
.item{margin:0 0 1.4em;break-inside:avoid}
.item-head{display:flex;justify-content:space-between;gap:.2em 1em;align-items:baseline;flex-wrap:wrap}
.item h3{font-size:1.05em}
.meta,.sub{color:var(--muted);font-size:.92em}
.tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:.5em}
.tags span{font-size:.82em;padding:2px 10px;border-radius:999px;background:var(--card);border:1px solid var(--line)}
.skill{margin-bottom:1em}
.skill h3{font-size:.95em}
@media print{:root{--bg:#fff;--ink:#000;--muted:#444;--line:#ccc;--card:#fff}body{font-size:12px}a{color:#000;text-decoration:none}}
`;

export const IMPORT_RULE = /@import\s+(?:url\([^)]*\)|"[^"]*"|'[^']*')[^;]*;?/g;

type Dated = { startDate?: string; endDate?: string };

const arr = <T>(x: T[] | undefined): T[] => (Array.isArray(x) ? x : []);

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const href = (url: unknown): string => (typeof url === "string" && /^(https?:\/\/|mailto:|tel:)/i.test(url) ? esc(url) : "");
const link = (text: unknown, url: unknown): string =>
  href(url) ? `<a href="${href(url)}" target="_blank" rel="noopener">${esc(text)}</a>` : esc(text);
const para = (s: unknown): string => (s ? `<p>${esc(s)}</p>` : "");
const list = (xs?: string[]): string => (arr(xs).length ? `<ul>${arr(xs).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "");
const tags = (xs?: string[]): string =>
  arr(xs).length ? `<div class="tags">${arr(xs).map((x) => `<span>${esc(x)}</span>`).join("")}</div>` : "";

function month(date: unknown): string {
  const m = /^(\d{4})-(\d{2})/.exec(typeof date === "string" ? date : "");
  if (!m) return esc(date);
  return new Date(Date.UTC(+m[1], +m[2] - 1)).toLocaleString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
}

const when = (x: Dated): string => (x.startDate ? `${month(x.startDate)} – ${month(x.endDate) || "Present"}` : month(x.endDate));

function item(title: string, sub: string, dates: Dated, body = ""): string {
  const meta = when(dates);
  return `<article class="item"><div class="item-head"><h3>${title}</h3>${meta ? `<span class="meta">${meta}</span>` : ""}</div>${
    sub ? `<div class="sub">${sub}</div>` : ""
  }${body}</article>`;
}

function sectionBodies(c: Resume): Record<SectionId, string> {
  return {
    about: para(c.basics?.summary),
    work: arr(c.work)
      .map((w) => {
        const org = w.name || w.company;
        const sub = w.position ? [esc(org), esc(w.location)].filter(Boolean).join(" · ") : "";
        return item(esc(w.position || org), sub, w, para(w.summary) + list(w.highlights));
      })
      .join(""),
    projects: arr(c.projects)
      .map((p) => item(link(p.name, p.url), "", p, para(p.description) + list(p.highlights) + tags(p.keywords)))
      .join(""),
    education: arr(c.education)
      .map((e) => item(esc(e.institution), esc([e.studyType, e.area].filter(Boolean).join(", ")), e))
      .join(""),
    skills: arr(c.skills)
      .map((s) => `<div class="skill"><h3>${esc(s.name)}</h3>${tags(s.keywords)}</div>`)
      .join(""),
  };
}

export function sections(site: Site, filter: { only?: SectionId[]; except?: SectionId[] } = {}): string {
  const bodies = sectionBodies(site.content);
  return site.sections.order
    .filter((id) => bodies[id] && !site.sections.hidden.includes(id))
    .filter((id) => (!filter.only || filter.only.includes(id)) && !filter.except?.includes(id))
    .map((id) => `<section id="${id}"><h2>${TITLES[id]}</h2><div class="${id}">${bodies[id]}</div></section>`)
    .join("");
}

export function contact(b: Resume["basics"] = {}): string {
  const loc =
    typeof b.location === "string" ? b.location : [b.location?.city, b.location?.region, b.location?.countryCode].filter(Boolean).join(", ");
  return [
    b.email && link(b.email, `mailto:${b.email}`),
    b.phone && esc(b.phone),
    loc && esc(loc),
    b.url && link(b.url.replace(/^https?:\/\//, ""), b.url),
    ...arr(b.profiles).map((p) => link(p.network || p.username, p.url)),
  ]
    .filter(Boolean)
    .map((x) => `<li>${x}</li>`)
    .join("");
}

export function page(site: Site, defaults: ThemeDefaults, css: string, body: string): string {
  const theme: ThemeDefaults = {
    accent: site.theme.accent ?? defaults.accent,
    font: site.theme.font ?? defaults.font,
    mode: site.theme.mode ?? defaults.mode,
  };
  const font = FONTS[theme.font];
  const imports = css.match(IMPORT_RULE)?.join("") ?? "";
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.content.basics?.name || "Personal site")}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=${font.spec}&display=swap" media="print" onload="this.media='all'">
<style>${imports}:root{--accent:${theme.accent};--font:"${font.family}",system-ui,sans-serif;${MODES[theme.mode]}}${BASE_CSS}${css.replace(IMPORT_RULE, "")}
${site.customCss.replaceAll("<", "")}</style></head><body>${body}</body></html>`;
}
