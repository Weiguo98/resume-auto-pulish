import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeSite, SECTION_IDS } from "../site.ts";
import { TEMPLATES, custom, renderSite } from "./index.ts";
import { SAMPLE } from "./sample.ts";

const content = {
  ...SAMPLE,
  basics: { ...SAMPLE.basics, name: "<script>alert(1)</script>", url: "javascript:alert(1)" },
  projects: [{ name: "X", url: "javascript:alert(1)", description: "d" }],
};

const design = { name: "Test", css: "body{color:red}" };

for (const t of [...TEMPLATES, custom]) {
  test(`${t.id} shows every section and escapes text`, () => {
    const html = renderSite(normalizeSite({ template: t.id, design, content }));
    for (const id of SECTION_IDS) assert.match(html, new RegExp(`id="${id}"`));
    assert.doesNotMatch(html, /<script>alert/);
    assert.doesNotMatch(html, /href="javascript:/);
    assert.match(html, /&lt;script&gt;/);
  });

  test(`${t.id} hides hidden sections`, () => {
    const html = renderSite(normalizeSite({ template: t.id, design, content, sections: { hidden: ["projects"] } }));
    assert.doesNotMatch(html, /id="projects"/);
  });
}

test("normalizeSite drops bad values", () => {
  const site = normalizeSite({
    template: "nope",
    theme: { accent: "red;}", font: "comic", mode: "dark" },
    sections: { order: ["skills", "x"] },
  });
  assert.equal(site.template, "minimal");
  assert.deepEqual(site.theme, { accent: null, font: null, mode: "dark" });
  assert.deepEqual(site.sections.order, ["skills", "about", "work", "projects", "education"]);
});

test("customCss cannot close the style tag", () => {
  assert.doesNotMatch(renderSite(normalizeSite({ customCss: "</style><script>x</script>" })), /<\/style><script>/);
});

test("custom needs a design", () => {
  assert.equal(normalizeSite({ template: "custom" }).template, "minimal");
  assert.equal(normalizeSite({ template: "custom", design }).template, "custom");
  assert.match(renderSite(normalizeSite({ template: "custom", design })), /body\{color:red\}/);
});

test("design css is made safe", () => {
  const css = '@import url("https://evil.test/x.css");@import url("https://fonts.googleapis.com/css2?family=Inter");</style><script>x</script>';
  const html = renderSite(normalizeSite({ template: "custom", design: { name: "x", css } }));
  assert.doesNotMatch(html, /<\/style><script>/);
  assert.doesNotMatch(html, /evil\.test/);
  assert.match(html, /<style>@import url\("https:\/\/fonts\.googleapis\.com/);
});

test("design css that is too long is dropped", () => {
  const site = normalizeSite({ template: "custom", design: { name: "x", css: "a".repeat(30_001) } });
  assert.equal(site.design, null);
  assert.equal(site.template, "minimal");
});

test("google fonts import with ; in the url keeps the stylesheet whole", () => {
  for (const url of ['url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400&display=swap")', "'https://fonts.googleapis.com/css2?family=Inter:wght@300;400'"]) {
    const css = `@import ${url};\nbody{background:#f7f5f0}`;
    const html = renderSite(normalizeSite({ template: "custom", design: { name: "x", css } }));
    const style = html.slice(html.indexOf("<style>") + 7, html.indexOf("</style>"));
    assert.ok(style.startsWith(`@import ${url};:root{`), style.slice(0, 120));
    assert.equal(style.match(/@import/g)?.length, 1);
  }
});
