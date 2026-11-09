import type { ReactNode } from "react";
import { Dropdown } from "./Dropdown.tsx";
import { DownloadIcon, UndoIcon } from "./icons.tsx";
import { Logo } from "./Logo.tsx";

export type View = "editor" | "published";

interface Props {
  cvMenu: ReactNode;
  view: View;
  publishedCount: number;
  onView(view: View): void;
  canUndo: boolean;
  canExport: boolean;
  publishing: boolean;
  publishLabel: string;
  unpublished: boolean;
  downloading: boolean;
  githubLogin: string | null;
  onConnect(): void;
  onLogout(): void;
  onUndo(): void;
  onDownload(): void;
  onPublish(): void;
}

export function Header(p: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <span className="brand">
          <Logo />
          Folio
        </span>
        <span className="slash">/</span>
        {p.cvMenu}
      </div>
      <nav className="segmented" aria-label="Pages">
        <button aria-pressed={p.view === "editor"} onClick={() => p.onView("editor")}>
          Editor
        </button>
        <button aria-pressed={p.view === "published"} onClick={() => p.onView("published")}>
          Published{p.publishedCount ? <span className="count">{p.publishedCount}</span> : null}
        </button>
      </nav>
      <div className="topbar-right">
        <button className="icon ghost" disabled={!p.canUndo} onClick={p.onUndo} title="Undo" aria-label="Undo">
          <UndoIcon />
        </button>
        <button className="ghost" disabled={!p.canExport || p.downloading} onClick={p.onDownload} title="Download this CV as a PDF">
          <DownloadIcon />
          {p.downloading ? "Making PDF…" : "PDF"}
        </button>
        <button
          className="primary"
          disabled={!p.canExport || p.publishing}
          title={p.unpublished ? "You have changes that are not live yet" : undefined}
          onClick={p.onPublish}
        >
          {p.publishing ? "Publishing…" : p.publishLabel}
          {p.unpublished && !p.publishing && <span className="dot" aria-label="Changes not live yet" />}
        </button>
        {p.githubLogin ? (
          <Dropdown
            className="avatar"
            ariaLabel={`Signed in as ${p.githubLogin}`}
            placement="down-end"
            label={<img src={`https://github.com/${p.githubLogin}.png?size=64`} alt="" />}
          >
            {() => (
              <>
                <p className="menu-label">Signed in as @{p.githubLogin}</p>
                <button type="button" role="menuitem" onClick={p.onLogout}>
                  Log out
                </button>
              </>
            )}
          </Dropdown>
        ) : (
          <button className="ghost" onClick={p.onConnect}>
            Connect GitHub
          </button>
        )}
      </div>
    </header>
  );
}
