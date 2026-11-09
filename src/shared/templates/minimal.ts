import type { Template } from "./index.ts";
import { contact, esc, page, sections, type ThemeDefaults } from "./html.ts";

const defaults: ThemeDefaults = { accent: "#2f5d50", font: "serif", mode: "light" };

const css = `
main{max-width:720px;margin:0 auto;padding:72px 24px 96px}
header{margin-bottom:56px}
h1{font-size:clamp(2.2rem,6vw,3.2rem);font-weight:600;letter-spacing:-.02em}
.label{font-size:1.2rem;color:var(--muted);margin:.3em 0 1em}
section{margin-top:48px}
h2{font-size:.78rem;text-transform:uppercase;letter-spacing:.14em;color:var(--accent);margin-bottom:20px;font-weight:600}
.skills{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px 24px}
`;

export const minimal: Template = {
  id: "minimal",
  name: "Minimal",
  description: "One column, serif type, lots of white space. Calm and classic. Fits almost anyone.",
  render(site) {
    const b = site.content.basics ?? {};
    return page(
      site,
      defaults,
      css,
      `<main><header><h1>${esc(b.name)}</h1><p class="label">${esc(b.label)}</p><ul class="contact">${contact(b)}</ul></header>${sections(site)}</main>`,
    );
  },
};
