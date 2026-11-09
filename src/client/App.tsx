import { useEffect, useMemo, useRef, useState } from "react";
import type { Attachment, GitHubProfile, PublishRecord, Version } from "../shared/api.ts";
import { normalizeSite, type Site } from "../shared/site.ts";
import { TEMPLATES, renderSite, type Template } from "../shared/templates/index.ts";
import { SAMPLE } from "../shared/templates/sample.ts";
import {
  LoginRequired,
  addVersion,
  deleteCv,
  downloadPdf,
  getGitHubProfile,
  getMe,
  getPublishes,
  logout,
  publishCv,
  newChat,
  retailorCv,
  sendChat,
  tailorCv,
  undoVersion,
} from "./api.ts";
import { Composer } from "./components/Composer.tsx";
import { CvMenu } from "./components/CvMenu.tsx";
import { MonitorIcon, NewChatIcon, PhoneIcon } from "./components/icons.tsx";
import { Header, type View } from "./components/Header.tsx";
import { Landing } from "./components/Landing.tsx";
import { MessageList } from "./components/MessageList.tsx";
import { PublishedPage } from "./components/PublishedPage.tsx";
import { Suggestions } from "./components/Suggestions.tsx";
import { TailorPanel } from "./components/TailorPanel.tsx";
import { StylePicker } from "./components/StylePicker.tsx";
import type { Note, PendingMessage } from "./types.ts";
import { useWorkspace } from "./useWorkspace.ts";

const EXAMPLES = [
  "I'm a product designer in London with 5 years of experience.",
  "I'm a final-year computer science student looking for my first software job.",
  "I'm a nurse moving into healthcare management.",
];

const currentChat = (versions: Version[]) => versions.slice(Math.max(0, versions.findLastIndex((v) => v.startsChat)));

const errorText = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong. Please try again.");


export function App() {
  const { cvs, cv, versions, loaded, loadError, select, refreshCvs, update } = useWorkspace();
  const [view, setView] = useState<View>("editor");
  const [draft, setDraft] = useState({ template: TEMPLATES[0].id, picked: false });
  const [notes, setNotes] = useState<Note[]>([]);
  const [pending, setPending] = useState<PendingMessage | null>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<Attachment | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [publishes, setPublishes] = useState<PublishRecord[]>([]);
  const [tailoring, setTailoring] = useState(false);
  const [githubLogin, setGithubLogin] = useState<string | null>(null);
  const [skippedLanding, setSkippedLanding] = useState(false);
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");

  const site = useMemo(() => versions.at(-1)?.site ?? normalizeSite({ template: draft.template }), [versions, draft.template]);
  const shown = useMemo(() => (versions.length ? site : { ...site, content: SAMPLE }), [versions.length, site]);
  const previewHtml = useMemo(() => renderSite(shown), [shown]);
  const busy = pending !== null;
  const hasSite = versions.length > 0;
  const chat = currentChat(versions);
  const live = publishes[0];
  const unpublished = Boolean(live && hasSite && JSON.stringify(live.site) !== JSON.stringify(site));
  const isMain = cv?.kind === "main";
  const mainHasSite = Boolean(cvs.find((c) => c.kind === "main")?.versionCount);

  const addNote = (kind: Note["kind"], text: string, link?: string) => setNotes((ns) => [...ns, { at: chat.length, kind, text, link }]);

  function added(v: Version) {
    update((list) => [...list, v]);
    void refreshCvs();
  }

  function selectCv(id: string) {
    select(id);
    setNotes([]);
    setTailoring(false);
  }

  async function send(raw: string, from?: { file: Attachment | null; github: boolean }) {
    const message = raw.trim() || (file ? "Use my attached CV to fill in my site." : "");
    if (!message || busy || !cv) return;
    const attached = from ? from.file : file;
    const setStatus = (status: string) => setPending((p) => p && { ...p, status });
    if (!from) {
      setText("");
      setFile(null);
    }
    setPending({ message, file: attached?.name, startedAt: Date.now() });
    try {
      let github: GitHubProfile | undefined;
      if (from?.github) {
        setStatus("Reading your GitHub");
        github = await getGitHubProfile();
        const langs = github.languages.slice(0, 3).join(", ");
        setStatus(`Read GitHub: ${github.repos.length} projects${langs ? ` · ${langs}` : ""}.\nWriting your site`);
      } else if (from) {
        setStatus("Reading your CV and writing your site");
      }
      added(await sendChat(cv.id, { message, draftTemplate: draft.template, templateChosen: draft.picked, file: attached, github }));
    } catch (err) {
      if (!from) setFile(attached);
      if (err instanceof LoginRequired) {
        setGithubLogin(null);
        addNote("error", "Your GitHub connection has expired. Connect GitHub again, then try once more.");
      } else if (from) {
        addNote("error", errorText(err));
      } else {
        setText(message);
        addNote("error", `${errorText(err)}\n\nYour message is back in the box, so you can send it again.`);
      }
    } finally {
      setPending(null);
    }
  }

  async function save(message: string, reply: string, next: Site) {
    if (!cv) return;
    try {
      added(await addVersion(cv.id, { message, reply, site: next }));
    } catch (err) {
      addNote("error", errorText(err));
    }
  }

  function pickTemplate(t: Template) {
    if (busy || t.id === site.template) return;
    if (!hasSite) return setDraft({ template: t.id, picked: true });
    const name = t.id === "custom" ? site.design?.name : t.name;
    void save(`Use the ${name} style`, `Done. Your site now uses the ${name} style. Your details stay the same.`, { ...site, template: t.id });
  }

  function restore(old: Site, when: string) {
    void save(`Restore the version published on ${when}`, "Done. This version is back in the editor. Publish again to make it live.", old);
    setView("editor");
  }

  async function handleUndo() {
    if (!cv) return;
    const undoesNewChat = versions.at(-1)?.startsChat;
    const at = currentChat(versions.slice(0, -1)).length;
    try {
      await undoVersion(cv.id);
      update((list) => list.slice(0, -1));
      void refreshCvs();
      const text = undoesNewChat ? "Done. Your earlier chat is back." : "Done. I went back to the previous version.";
      setNotes((ns) => [...(undoesNewChat ? [] : ns.filter((n) => n.at <= at)), { at, kind: "ai", text }]);
    } catch (err) {
      addNote("error", errorText(err));
    }
  }

  async function publish() {
    if (!cv) return;
    setPublishing(true);
    try {
      const { url } = await publishCv(cv.id);
      setPublishes(await getPublishes(cv.id));
      addNote(
        "ai",
        isMain
          ? "Your site is live. The first time, it can take about a minute before the link works."
          : "This CV is online. Only people with the link can find it, but anyone with the link can open it.",
        url,
      );
    } catch (err) {
      if (err instanceof LoginRequired) {
        window.location.href = "/auth/github?then=publish";
        return;
      }
      addNote("error", errorText(err));
    } finally {
      setPublishing(false);
    }
  }

  async function download() {
    if (!cv) return;
    setDownloading(true);
    try {
      const { blob, name } = await downloadPdf(cv.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addNote("error", errorText(err));
    } finally {
      setDownloading(false);
    }
  }

  async function tailor(jd: string) {
    setTailoring(false);
    setPending({ message: "Tailor my CV for this job", status: "Tailoring your CV for this job", startedAt: Date.now() });
    try {
      const { cv: made } = await tailorCv(jd);
      await refreshCvs();
      selectCv(made.id);
    } catch (err) {
      addNote("error", errorText(err));
    } finally {
      setPending(null);
    }
  }

  async function retailor() {
    if (!cv) return;
    setPending({ message: "Tailor again from my updated main CV", status: "Tailoring again", startedAt: Date.now() });
    try {
      added(await retailorCv(cv.id));
    } catch (err) {
      addNote("error", errorText(err));
    } finally {
      setPending(null);
    }
  }

  async function startNewChat() {
    if (!cv) return;
    try {
      const marker = await newChat(cv.id);
      update((list) => [...list, marker]);
      setNotes([]);
    } catch (err) {
      addNote("error", errorText(err));
    }
  }

  async function removeCv() {
    if (!cv || cv.kind !== "variant" || !confirm(`Delete "${cv.name}"? Its chat goes too. Your main CV stays.`)) return;
    try {
      await deleteCv(cv.id);
      const list = await refreshCvs();
      selectCv(list[0].id);
    } catch (err) {
      addNote("error", errorText(err));
    }
  }

  function buildFromProfiles(cvFile: Attachment | null, github: boolean) {
    const names = [cvFile && "CV", github && "GitHub"].filter(Boolean).join(" and ");
    setSkippedLanding(true);
    void send(`Build my site from my ${names}.`, { file: cvFile, github });
  }

  function addGitHub() {
    if (!githubLogin) {
      window.location.href = "/auth/github?then=github";
      return;
    }
    void send("Add my GitHub projects and skills to my site.", { file: null, github: true });
  }

  async function signOut() {
    await logout();
    window.location.reload();
  }

  // Runs after the CV list has loaded, so the first request alone creates the session cookie.
  useEffect(() => {
    if (!loaded) return;
    getMe()
      .then((me) => setGithubLogin(me.login))
      .catch(() => {});
  }, [loaded]);

  useEffect(() => {
    if (!cv) return;
    getPublishes(cv.id)
      .then(setPublishes)
      .catch(() => setPublishes([]));
  }, [cv?.id]);

  const resumedPublish = useRef(false);
  useEffect(() => {
    if (!loaded || resumedPublish.current) return;
    resumedPublish.current = true;
    const params = new URLSearchParams(window.location.search);
    if (!params.size) return;
    window.history.replaceState(null, "", "/");
    if (params.has("publish") && hasSite) void publish();
    if (params.has("github")) setSkippedLanding(true);
    if (params.has("github")) void send("Add my GitHub projects and skills to my site.", { file: null, github: true });
  }, [loaded]);

  if (loadError) return <p className="load-error">{loadError}</p>;
  if (!cv || !loaded) return null;

  if (!skippedLanding && cvs.length === 1 && !hasSite) {
    return (
      <Landing
        githubLogin={githubLogin}
        onConnectGitHub={() => (window.location.href = "/auth/github")}
        onBuild={buildFromProfiles}
        onSkip={() => setSkippedLanding(true)}
      />
    );
  }

  const canClearChat = chat.length > 1 || (chat.length === 1 && !chat[0].startsChat);

  return (
    <>
      <Header
        cvMenu={
          <CvMenu
            cvs={cvs}
            cv={cv}
            disabled={busy}
            canTailor={mainHasSite}
            onSelect={(id) => {
              selectCv(id);
              setView("editor");
            }}
            onTailor={() => {
              setView("editor");
              setTailoring(true);
            }}
            onDelete={removeCv}
          />
        }
        view={view}
        publishedCount={publishes.length}
        onView={setView}
        canUndo={hasSite && !busy}
        canExport={hasSite && !busy}
        publishing={publishing}
        publishLabel={isMain ? "Publish" : "Publish link"}
        unpublished={unpublished}
        downloading={downloading}
        githubLogin={githubLogin}
        onConnect={() => (window.location.href = "/auth/github")}
        onLogout={signOut}
        onUndo={handleUndo}
        onDownload={download}
        onPublish={publish}
      />
      {view === "published" ? (
        <PublishedPage title={isMain ? "your main CV" : cv.name} published={publishes} onRestore={restore} />
      ) : (
        <main className="layout">
          <section className="chat">
            <div className="chat-head">
              <span>{isMain ? "Chat" : `Tailored for ${cv.name}`}</span>
              <button
                className="icon ghost"
                disabled={busy || !canClearChat}
                title="New chat. Your site stays as it is."
                aria-label="New chat"
                onClick={startNewChat}
              >
                <NewChatIcon />
              </button>
            </div>
            {cv.kind === "variant" && cv.stale && cv.jd && (
              <p className="notice">
                Your main CV changed after this one was made.
                <button type="button" className="link" disabled={busy} onClick={retailor}>
                  Tailor it again
                </button>
              </p>
            )}
            <MessageList versions={chat} notes={notes} pending={pending} liveVersionId={live?.versionId ?? null} />
            {tailoring && (
              <div className="panel">
                <TailorPanel disabled={busy} onTailor={tailor} onClose={() => setTailoring(false)} />
              </div>
            )}
            {!busy && !tailoring && <Suggestions items={hasSite ? (versions.at(-1)?.suggestions ?? []) : EXAMPLES} onPick={send} />}
            <Composer
              text={text}
              file={file}
              disabled={busy}
              onText={setText}
              onFile={setFile}
              onSend={() => send(text)}
              onGitHub={addGitHub}
              onError={(message) => addNote("error", message)}
            />
          </section>
          <section className="preview">
            <div className="preview-bar">
              <div className="segmented small" aria-label="Preview size">
                <button aria-pressed={device === "desktop"} aria-label="Desktop" title="Desktop" onClick={() => setDevice("desktop")}>
                  <MonitorIcon />
                </button>
                <button aria-pressed={device === "phone"} aria-label="Phone" title="Phone" onClick={() => setDevice("phone")}>
                  <PhoneIcon />
                </button>
              </div>
              {!hasSite && <span className="badge">Sample content</span>}
              <StylePicker site={shown} disabled={busy} onPick={pickTemplate} />
            </div>
            <div className="stage">
              <iframe className={`frame ${device}`} title="Site preview" srcDoc={previewHtml} sandbox="allow-scripts allow-popups" />
            </div>
          </section>
        </main>
      )}
    </>
  );
}
