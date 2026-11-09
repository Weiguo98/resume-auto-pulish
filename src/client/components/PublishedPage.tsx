import { useMemo, useState } from "react";
import type { PublishRecord } from "../../shared/api.ts";
import type { Site } from "../../shared/site.ts";
import { TEMPLATES, renderSite } from "../../shared/templates/index.ts";

interface Props {
  title: string;
  published: PublishRecord[];
  onRestore(site: Site, when: string): void;
}

const when = (at: string) => new Date(at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

const styleName = (site: Site) => (site.template === "custom" ? site.design?.name : TEMPLATES.find((t) => t.id === site.template)?.name);

export function PublishedPage({ title, published, onRestore }: Props) {
  const [selected, setSelected] = useState(0);
  const html = useMemo(() => published.map((p) => renderSite(p.site)), [published]);
  const live = published[0];

  if (!live) {
    return (
      <main className="published empty">
        <h2>Nothing published yet</h2>
        <p>Click Publish in the editor to put {title} online. Each version you publish shows up here.</p>
      </main>
    );
  }

  return (
    <main className="published">
      <div className="published-head">
        <div>
          <h2>Published versions of {title}</h2>
          <p>The live link shows the newest one. Older ones stay here, so you can bring them back.</p>
        </div>
        <div className="links">
          <a href={live.url} target="_blank" rel="noopener">
            Open live site ↗
          </a>
          <a href={`${live.repo}/commits`} target="_blank" rel="noopener">
            Full history on GitHub ↗
          </a>
        </div>
      </div>
      <div className="published-body">
        <ul className="published-list">
          {published.map((p, i) => (
            <li key={p.id}>
              <button type="button" className="version" aria-pressed={i === selected} onClick={() => setSelected(i)}>
                <div className="thumb">
                  <iframe srcDoc={html[i]} sandbox="allow-scripts" tabIndex={-1} aria-hidden="true" title={`Version from ${when(p.createdAt)}`} />
                </div>
                <span>
                  <b>{when(p.createdAt)}</b>
                  {i === 0 && <em className="live">Live</em>}
                  <small>{styleName(p.site)} style</small>
                </span>
              </button>
            </li>
          ))}
        </ul>
        <section className="published-preview">
          <div className="bar">
            <span>
              {when(published[selected].createdAt)}
              {selected === 0 ? " · live now" : ""}
            </span>
            <button type="button" className="primary" onClick={() => onRestore(published[selected].site, when(published[selected].createdAt))}>
              Restore in editor
            </button>
          </div>
          <iframe className="frame" title="Published version preview" srcDoc={html[selected]} sandbox="allow-scripts allow-popups" />
        </section>
      </div>
    </main>
  );
}
