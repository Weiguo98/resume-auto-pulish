import type { Template } from "./index.ts";
import { contact, esc, page, sections, type ThemeDefaults } from "./html.ts";

const defaults: ThemeDefaults = { accent: "#4ade80", font: "mono", mode: "dark" };

const css = `
main{max-width:920px;margin:0 auto;padding:64px 24px 96px;font-size:15px}
.prompt{color:var(--accent);margin:0 0 8px}
h1{font-size:clamp(2rem,6vw,3rem);font-weight:800}
.cursor{color:var(--accent);animation:blink 1s steps(1) infinite}
@keyframes blink{50%{opacity:0}}
.label{color:var(--muted);margin:.5em 0 1em}
section{margin-top:56px}
h2{font-size:1rem;color:var(--accent);margin-bottom:20px;font-weight:600}
h2::before{content:"## ";opacity:.6}
.projects,.skills{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:16px}
.projects .item{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:18px;margin:0}
.projects .item-head{flex-direction:column}
.tags span{border-radius:4px}
@media (prefers-reduced-motion:reduce){.cursor{animation:none}}
@media print{.cursor{display:none}}
`;

export const developer: Template = {
  id: "developer",
  name: "Developer",
  description: "Dark, monospace type, terminal feel, projects shown as cards. Good for engineers and technical roles.",
  render(site) {
    const b = site.content.basics ?? {};
    const header = `<p class="prompt">$ whoami</p><h1>${esc(b.name)}<span class="cursor" aria-hidden="true">_</span></h1><p class="label">${esc(
      b.label,
    )}</p><ul class="contact">${contact(b)}</ul>`;
    return page(site, defaults, css, `<main><header>${header}</header>${sections(site)}</main>`);
  },
};
