import type { SectionId } from "../site.ts";
import type { Template } from "./index.ts";
import { contact, esc, page, sections, type ThemeDefaults } from "./html.ts";

const defaults: ThemeDefaults = { accent: "#2563eb", font: "sans", mode: "light" };
const SIDEBAR: SectionId[] = ["skills", "education"];

const css = `
.wrap{display:grid;grid-template-columns:320px 1fr;min-height:100vh}
aside{background:var(--card);border-right:1px solid var(--line);border-top:6px solid var(--accent);padding:56px 32px}
aside h1{font-size:2rem;font-weight:800;letter-spacing:-.02em;color:var(--accent)}
.label{font-weight:500;margin:.4em 0 1.2em}
aside .contact{flex-direction:column;gap:.5em}
aside section{margin-top:32px}
aside .item{margin-bottom:1em}
main{padding:56px 56px 96px;max-width:880px}
main section{margin-top:44px}
main section:first-child{margin-top:0}
h2{font-size:1.1rem;font-weight:700;margin-bottom:16px;padding-bottom:6px;border-bottom:2px solid var(--accent);display:inline-block}
@media(max-width:760px){.wrap{grid-template-columns:1fr}aside{border-right:none;padding:40px 24px}main{padding:32px 24px 64px}}
@media print{.wrap{grid-template-columns:230px 1fr}}
`;

export const modern: Template = {
  id: "modern",
  name: "Modern",
  description:
    "Sidebar with contact details, skills and education, plus a bold accent color. Business-like. Good for product, sales and management roles.",
  render(site) {
    const b = site.content.basics ?? {};
    const aside = `<h1>${esc(b.name)}</h1><p class="label">${esc(b.label)}</p><ul class="contact">${contact(b)}</ul>${sections(site, { only: SIDEBAR })}`;
    return page(site, defaults, css, `<div class="wrap"><aside>${aside}</aside><main>${sections(site, { except: SIDEBAR })}</main></div>`);
  },
};
