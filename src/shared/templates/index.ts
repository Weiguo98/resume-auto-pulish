import type { Site } from "../site.ts";
import { minimal } from "./minimal.ts";
import { modern } from "./modern.ts";
import { developer } from "./developer.ts";
import { creative } from "./creative.ts";
import { custom } from "./custom.ts";

export { custom };

export interface Template {
  id: string;
  name: string;
  description: string;
  render(site: Site): string;
}

export const TEMPLATES: Template[] = [minimal, modern, developer, creative];

export function renderSite(site: Site): string {
  if (site.template === custom.id && site.design) return custom.render(site);
  return (TEMPLATES.find((t) => t.id === site.template) ?? TEMPLATES[0]).render(site);
}
