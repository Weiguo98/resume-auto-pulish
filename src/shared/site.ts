import { IMPORT_RULE } from "./templates/html.ts";
import { TEMPLATES, custom } from "./templates/index.ts";

export const SECTION_IDS = ["about", "work", "projects", "education", "skills"] as const;
export const FONT_IDS = ["sans", "serif", "mono"] as const;
export const MODE_IDS = ["light", "dark"] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type Font = (typeof FONT_IDS)[number];
export type Mode = (typeof MODE_IDS)[number];

export interface Theme {
  accent: string | null;
  font: Font | null;
  mode: Mode | null;
}

export interface Design {
  name: string;
  css: string;
}

export interface Site {
  template: string;
  theme: Theme;
  sections: { order: SectionId[]; hidden: SectionId[] };
  customCss: string;
  design: Design | null;
  content: Resume;
}

const MAX_DESIGN_CSS = 30_000;
const GOOGLE_FONTS = /^@import\s+(url\(\s*)?["']?https:\/\/fonts\.googleapis\.com\//i;

function design(raw: any): Design | null {
  if (typeof raw?.name !== "string" || typeof raw?.css !== "string" || raw.css.length > MAX_DESIGN_CSS) return null;
  return { name: raw.name.slice(0, 40), css: raw.css.replaceAll("<", "").replace(IMPORT_RULE, (rule: string) => (GOOGLE_FONTS.test(rule) ? rule : "")) };
}

export interface Resume {
  basics?: {
    name?: string;
    label?: string;
    email?: string;
    phone?: string;
    url?: string;
    summary?: string;
    location?: string | { city?: string; region?: string; countryCode?: string };
    profiles?: { network?: string; username?: string; url?: string }[];
  };
  work?: { name?: string; company?: string; position?: string; location?: string; summary?: string; highlights?: string[]; startDate?: string; endDate?: string }[];
  projects?: { name?: string; url?: string; description?: string; highlights?: string[]; keywords?: string[]; startDate?: string; endDate?: string }[];
  education?: { institution?: string; studyType?: string; area?: string; startDate?: string; endDate?: string }[];
  skills?: { name?: string; keywords?: string[] }[];
}

const isOneOf = <T extends string>(list: readonly T[], value: unknown): value is T => list.includes(value as T);

const ids = (value: unknown): SectionId[] => (Array.isArray(value) ? value.filter((id) => isOneOf(SECTION_IDS, id)) : []);

export function normalizeSite(input: unknown): Site {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, any>;
  const theme = raw.theme ?? {};
  const own = design(raw.design);
  const template = own && raw.template === custom.id ? custom : (TEMPLATES.find((t) => t.id === raw.template) ?? TEMPLATES[0]);
  return {
    template: template.id,
    theme: {
      accent: typeof theme.accent === "string" && /^#[0-9a-f]{3,8}$/i.test(theme.accent) ? theme.accent : null,
      font: isOneOf(FONT_IDS, theme.font) ? theme.font : null,
      mode: isOneOf(MODE_IDS, theme.mode) ? theme.mode : null,
    },
    sections: {
      order: [...new Set([...ids(raw.sections?.order), ...SECTION_IDS])],
      hidden: ids(raw.sections?.hidden),
    },
    customCss: typeof raw.customCss === "string" ? raw.customCss : "",
    design: own,
    content: raw.content && typeof raw.content === "object" ? raw.content : {},
  };
}
