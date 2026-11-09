import { test } from "node:test";
import assert from "node:assert/strict";
import { newFacts } from "./tailor.ts";

test("newFacts lists only what the tailored CV adds", () => {
  const main = {
    work: [{ name: "Mimo", position: "Engineer" }],
    projects: [{ name: "ledger", keywords: ["Go"] }],
    skills: [{ name: "Languages", keywords: ["Go", "Python"] }],
  };
  const tailored = {
    work: [{ name: "mimo", position: "Backend Engineer", summary: "Reworded" }],
    projects: [{ name: "Ledger", keywords: ["go", "Kubernetes"] }],
    skills: [{ name: "Languages", keywords: ["Python", "Rust"] }],
    education: [{ institution: "MIT" }],
  };
  assert.deepEqual(newFacts(main, tailored), ["MIT", "Kubernetes", "Rust"]);
});
