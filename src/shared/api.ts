import type { Site } from "./site.ts";

export interface Attachment {
  name: string;
  type: string;
  data: string;
}

export interface Cv {
  id: string;
  name: string;
  kind: "main" | "variant";
  parentId: string | null;
  jd: string | null;
  stale: boolean;
  versionCount: number;
}

export interface Version {
  id: string;
  seq: number;
  message: string;
  file: string | null;
  reply: string;
  suggestions: string[];
  site: Site;
  startsChat: boolean;
  createdAt: string;
}

export interface PublishRecord {
  id: string;
  cvId: string;
  versionId: string | null;
  url: string;
  repo: string;
  site: Site;
  createdAt: string;
}

export interface ChatRequest {
  message: string;
  draftTemplate: string;
  templateChosen: boolean;
  file: Attachment | null;
  github?: GitHubProfile;
}

export interface NewVersionRequest {
  message: string;
  reply: string;
  site: Site;
}

export interface TailorRequest {
  jd: string;
}

export interface TailorResponse {
  cv: Cv;
  version: Version;
}

export interface PublishResponse {
  url: string;
  repo: string;
}

export interface ErrorResponse {
  error?: string;
  login?: boolean;
}

export interface GitHubRepo {
  name: string;
  description: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  url: string;
  homepage: string | null;
  pushedAt: string;
}

export interface GitHubProfile {
  login: string;
  name: string | null;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  url: string;
  languages: string[];
  repos: GitHubRepo[];
  readme: string | null;
}
