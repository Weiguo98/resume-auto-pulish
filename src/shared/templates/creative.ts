import type { Template } from "./index.ts";
import { contact, esc, page, sections, type ThemeDefaults } from "./html.ts";

const defaults: ThemeDefaults = { accent: "#d9480f", font: "sans", mode: "light" };

// ponytail: hero text is always white, so a very light accent loses contrast; pick text color from accent luminance if users hit it.
const css = `
.hero{background:var(--accent);color:#fff;padding:96px 24px 72px}
.hero .inner,main{max-width:980px;margin:0 auto}
.hello{font-size:1.1rem;opacity:.85;margin:0}
.hero h1{font-size:clamp(3rem,11vw,7rem);font-weight:800;letter-spacing:-.04em;line-height:.95;margin:.1em 0 .2em}
.hero .label{font-size:clamp(1.1rem,2.5vw,1.5rem);max-width:32ch}
.hero .contact{color:#fff;opacity:.9;margin-top:24px}
main{padding:24px 24px 96px}
section{display:grid;grid-template-columns:200px 1fr;gap:24px;padding:48px 0;border-bottom:1px solid var(--line)}
h2{font-size:1.6rem;font-weight:800;letter-spacing:-.02em;color:var(--accent)}
.about p{font-size:1.35rem;line-height:1.5;margin-top:0}
.projects{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px}
.projects .item{background:var(--card);padding:20px;border-radius:16px;margin:0}
@media(max-width:700px){section{grid-template-columns:1fr;gap:12px}}
@media print{.hero{background:none;color:#000;padding:0 0 24px}.hero .contact{color:#000}}
`;

export const creative: Template = {
  id: "creative",
  name: "Creative",
  description: "Big, colorful header with a very large name and bold type. Playful and confident. Good for designers, marketers and creative roles.",
  render(site) {
    const b = site.content.basics ?? {};
    const hero = `<p class="hello">Hello, I'm</p><h1>${esc(b.name)}</h1><p class="label">${esc(b.label)}</p><ul class="contact">${contact(b)}</ul>`;
    return page(site, defaults, css, `<header class="hero"><div class="inner">${hero}</div></header><main>${sections(site)}</main>`);
  },
};
