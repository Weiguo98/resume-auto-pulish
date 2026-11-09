import type {
  ChatRequest,
  Cv,
  ErrorResponse,
  GitHubProfile,
  NewVersionRequest,
  PublishRecord,
  PublishResponse,
  TailorResponse,
  Version,
} from "../shared/api.ts";

export class LoginRequired extends Error {}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (res.status === 204) return undefined as T;
  const data = (await res.json().catch(() => ({}))) as T & ErrorResponse;
  if (res.status === 401 && data.login) throw new LoginRequired();
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export const getMe = () => call<{ login: string | null }>("GET", "/api/me");
export const logout = () => call<void>("POST", "/auth/logout");
export const getGitHubProfile = () => call<GitHubProfile>("GET", "/api/github/profile");

export const getCvs = () => call<Cv[]>("GET", "/api/cvs");
export const deleteCv = (cvId: string) => call<void>("DELETE", `/api/cvs/${cvId}`);
export const tailorCv = (jd: string) => call<TailorResponse>("POST", "/api/cvs/tailor", { jd });
export const retailorCv = (cvId: string) => call<Version>("POST", `/api/cvs/${cvId}/retailor`);

export const getVersions = (cvId: string) => call<Version[]>("GET", `/api/cvs/${cvId}/versions`);
export const addVersion = (cvId: string, v: NewVersionRequest) => call<Version>("POST", `/api/cvs/${cvId}/versions`, v);
export const newChat = (cvId: string) => call<Version>("POST", `/api/cvs/${cvId}/new-chat`);
export const undoVersion = (cvId: string) => call<void>("DELETE", `/api/cvs/${cvId}/versions/last`);
export const sendChat = (cvId: string, req: ChatRequest) => call<Version>("POST", `/api/cvs/${cvId}/chat`, req);

export async function downloadPdf(cvId: string): Promise<{ blob: Blob; name: string }> {
  const res = await fetch(`/api/cvs/${cvId}/pdf`);
  if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as ErrorResponse).error ?? "The PDF didn't download. Please try again.");
  const name = /filename="([^"]+)"/.exec(res.headers.get("Content-Disposition") ?? "")?.[1] ?? "cv.pdf";
  return { blob: await res.blob(), name };
}

export const publishCv = (cvId: string) => call<PublishResponse>("POST", `/api/cvs/${cvId}/publish`);
export const getPublishes = (cvId: string) => call<PublishRecord[]>("GET", `/api/cvs/${cvId}/publishes`);
