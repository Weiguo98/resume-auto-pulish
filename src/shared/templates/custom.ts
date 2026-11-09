import type { Template } from "./index.ts";
import { contact, esc, page, sections, type ThemeDefaults } from "./html.ts";

const defaults: ThemeDefaults = { accent: "#111111", font: "sans", mode: "light" };

export const SKELETON = `<body>
  <main class="page">
    <header class="hero">
      <h1 class="name">…</h1>
      <p class="label">…</p>
      <ul class="contact"><li><a>…</a></li>…</ul>
    </header>
    <section id="about"><h2>About</h2><div class="about"><p>…</p></div></section>
    <section id="work"><h2>Experience</h2><div class="work">
      <article class="item"><div class="item-head"><h3>…</h3><span class="meta">dates</span></div><div class="sub">…</div><p>…</p><ul><li>…</li></ul></article>…
    </div></section>
    <section id="projects"><h2>Projects</h2><div class="projects"><article class="item">… <div class="tags"><span>…</span></div></article>…</div></section>
    <section id="education"><h2>Education</h2><div class="education"><article class="item">…</article>…</div></section>
    <section id="skills"><h2>Skills</h2><div class="skills"><div class="skill"><h3>…</h3><div class="tags"><span>…</span></div></div>…</div></section>
    <div class="deco deco-1"></div> … <div class="deco deco-6"></div>
  </main>
</body>
Sections appear in the user's order. Hidden or empty sections are left out. The .deco divs are empty and hidden (display:none) until your CSS shows them. Use them for color blocks, lines or shapes.`;

export const custom: Template = {
  id: "custom",
  name: "Your design",
  description: "A design made just for this person. Uses design.css.",
  render(site) {
    const b = site.content.basics ?? {};
    const deco = [1, 2, 3, 4, 5, 6].map((i) => `<div class="deco deco-${i}" aria-hidden="true"></div>`).join("");
    return page(
      site,
      defaults,
      `.deco{display:none}\n${site.design?.css ?? ""}`,
      `<main class="page"><header class="hero"><h1 class="name">${esc(b.name)}</h1><p class="label">${esc(b.label)}</p><ul class="contact">${contact(b)}</ul></header>${sections(site)}${deco}</main>`,
    );
  },
};
