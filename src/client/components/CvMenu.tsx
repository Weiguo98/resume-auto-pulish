import type { Cv } from "../../shared/api.ts";
import { CheckIcon, ChevronIcon } from "./icons.tsx";
import { Dropdown } from "./Dropdown.tsx";

interface Props {
  cvs: Cv[];
  cv: Cv;
  disabled: boolean;
  canTailor: boolean;
  onSelect(id: string): void;
  onTailor(): void;
  onDelete(): void;
}

const label = (c: Cv) => (c.kind === "main" ? "Main CV" : c.name);

export function CvMenu({ cvs, cv, disabled, canTailor, onSelect, onTailor, onDelete }: Props) {
  return (
    <Dropdown
      className="ghost cv-trigger"
      disabled={disabled}
      label={
        <>
          <span className="cv-name">{label(cv)}</span>
          <ChevronIcon />
        </>
      }
    >
      {(close) => (
        <>
          <p className="menu-label">Your CVs</p>
          {cvs.map((c) => (
            <button
              key={c.id}
              type="button"
              role="menuitem"
              onClick={() => {
                close();
                onSelect(c.id);
              }}
            >
              <span className="check">{c.id === cv.id && <CheckIcon />}</span>
              {label(c)}
              {c.kind === "main" && <span className="tag">Main</span>}
            </button>
          ))}
          <hr />
          <button
            type="button"
            role="menuitem"
            disabled={!canTailor}
            title={canTailor ? undefined : "Build your main CV first"}
            onClick={() => {
              close();
              onTailor();
            }}
          >
            <span className="check" />
            Tailor for a job…
          </button>
          {cv.kind === "variant" && (
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={() => {
                close();
                onDelete();
              }}
            >
              <span className="check" />
              Delete this CV
            </button>
          )}
        </>
      )}
    </Dropdown>
  );
}
