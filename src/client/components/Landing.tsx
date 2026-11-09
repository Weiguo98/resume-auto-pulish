import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import type { Attachment } from "../../shared/api.ts";
import { readAttachment } from "../readAttachment.ts";
import { Logo } from "./Logo.tsx";

interface Props {
  githubLogin: string | null;
  onConnectGitHub(): void;
  onBuild(file: Attachment | null, github: boolean): void;
  onSkip(): void;
}

const STEPS = [
  ["Connect", "Connect GitHub and add your CV or LinkedIn PDF."],
  ["Chat", "I write the first version. Change anything by asking."],
  ["Publish", "One click puts it on your own github.io address."],
];

export function Landing({ githubLogin, onConnectGitHub, onBuild, onSkip }: Props) {
  const [file, setFile] = useState<Attachment | null>(null);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError("");
    try {
      setFile(await readAttachment(f));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That file can't be read. Try another one.");
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!file && !githubLogin) return setError("Connect GitHub or add your CV first.");
    onBuild(file, Boolean(githubLogin));
  }

  return (
    <main className="landing">
      <div className="landing-inner">
        <p className="brand">
          <Logo size={24} />
          Folio
        </p>
        <h1>Your personal website, built from what you already have</h1>
        <p className="lead">Connect GitHub and add your CV. I'll write the first version, then you change it by chatting.</p>
        <form className="import" onSubmit={submit}>
          <h3>Start from what you have</h3>
          <p className="hint">Use one or both. I'll build your site from them.</p>

          <label>GitHub</label>
          {githubLogin ? (
            <div className="connected">✓ @{githubLogin} · public repos</div>
          ) : (
            <button type="button" onClick={onConnectGitHub}>
              Connect GitHub
            </button>
          )}
          <p className="hint">Public repos only. Private repos are never read.</p>

          <label>CV or LinkedIn PDF</label>
          <button type="button" onClick={() => fileInput.current?.click()}>
            {file ? `📎 ${file.name}` : "Choose a file"}
          </button>
          <input ref={fileInput} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" hidden onChange={pick} />
          <p className="hint">From LinkedIn: open your profile, choose More, then Save to PDF.</p>

          {error && <p className="error">{error}</p>}
          <button type="submit" className="primary">
            Build my CV
          </button>
        </form>
        <button type="button" className="skip" onClick={onSkip}>
          Skip, I'll describe myself in the chat →
        </button>
        <ol className="steps">
          {STEPS.map(([title, text], i) => (
            <li key={title}>
              <b>
                {i + 1}. {title}
              </b>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
