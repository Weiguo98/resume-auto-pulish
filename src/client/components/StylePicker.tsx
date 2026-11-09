import type { Site } from "../../shared/site.ts";
import { TEMPLATES, custom, renderSite, type Template } from "../../shared/templates/index.ts";
import { ChevronIcon } from "./icons.tsx";
import { Dropdown } from "./Dropdown.tsx";

interface Props {
  site: Site;
  disabled: boolean;
  onPick(template: Template): void;
}

export function StylePicker({ site, disabled, onPick }: Props) {
  const choices = site.design ? [...TEMPLATES, custom] : TEMPLATES;
  const name = (t: Template) => (t === custom ? site.design?.name : t.name);
  const current = choices.find((t) => t.id === site.template) ?? TEMPLATES[0];

  return (
    <Dropdown
      className="ghost"
      disabled={disabled}
      placement="down-end"
      label={
        <>
          <span className="muted">Style</span> {name(current)}
          <ChevronIcon />
        </>
      }
    >
      {(close) => (
        <div className="styles" role="group" aria-label="Choose a style">
          {choices.map((t) => (
            <button
              key={t.id}
              type="button"
              className="style"
              title={t === custom ? site.design?.name : t.description}
              aria-pressed={t.id === site.template}
              onClick={() => {
                close();
                onPick(t);
              }}
            >
              <div className="thumb">
                <iframe srcDoc={renderSite({ ...site, template: t.id })} sandbox="allow-scripts" tabIndex={-1} aria-hidden="true" title={t.name} />
              </div>
              <b>{name(t)}</b>
            </button>
          ))}
        </div>
      )}
    </Dropdown>
  );
}
