import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Note, PendingMessage } from "../types.ts";
import type { Version } from "../../shared/api.ts";

interface Props {
  versions: Version[];
  notes: Note[];
  pending: PendingMessage | null;
  liveVersionId: string | null;
}

function Bubble({ kind, children }: { kind: "user" | "ai" | "error"; children: ReactNode }) {
  return <div className={`msg ${kind}`}>{children}</div>;
}

function UserBubble({ message, file }: { message: string; file?: string | null }) {
  return (
    <Bubble kind="user">
      {message}
      {file && <span className="file">📎 {file}</span>}
    </Bubble>
  );
}

function Working({ startedAt, status = "Working on it" }: { startedAt: number; status?: string }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="msg ai dots">{status} ({Math.round((now - startedAt) / 1000)}s)</div>;
}

function NoteBubble({ note }: { note: Note }) {
  return (
    <Bubble kind={note.kind}>
      {note.text}
      {note.link && (
        <>
          {"\n"}
          <a href={note.link} target="_blank" rel="noopener">
            {note.link}
          </a>
        </>
      )}
    </Bubble>
  );
}

export function MessageList({ versions, notes, pending, liveVersionId }: Props) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    box.current?.scrollTo({ top: box.current.scrollHeight });
  });

  const notesAt = (i: number) => notes.filter((n) => n.at === i).map((n, j) => <NoteBubble key={`n${i}-${j}`} note={n} />);

  return (
    <div className="messages" ref={box} aria-live="polite">
      {!versions.length && !pending && (
        <div className="welcome">
          <h2>Let's build your personal site</h2>
          <p>Pick a style on the right, or let me choose one for you.</p>
          <p>Then tell me who you are and what job you want. Use + to attach your CV or add your GitHub projects.</p>
        </div>
      )}
      {notesAt(0)}
      {versions.map((v, i) => [
        !v.startsChat && <UserBubble key={`u${i}`} message={v.message} file={v.file} />,
        <Bubble key={`a${i}`} kind="ai">
          {v.reply}
          {v.id === liveVersionId && (
            <span className="live" title="This version is on your live site">
              Live
            </span>
          )}
        </Bubble>,
        ...notesAt(i + 1),
      ])}
      {pending && (
        <>
          <UserBubble message={pending.message} file={pending.file} />
          <Working startedAt={pending.startedAt} status={pending.status} />
        </>
      )}
    </div>
  );
}
