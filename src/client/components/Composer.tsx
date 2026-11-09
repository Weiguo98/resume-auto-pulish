import { useRef, type ChangeEvent, type KeyboardEvent } from "react";
import type { Attachment } from "../../shared/api.ts";
import { readAttachment } from "../readAttachment.ts";
import { Dropdown } from "./Dropdown.tsx";
import { PlusIcon, SendIcon } from "./icons.tsx";

interface Props {
  text: string;
  file: Attachment | null;
  disabled: boolean;
  onText(text: string): void;
  onFile(file: Attachment | null): void;
  onSend(): void;
  onGitHub(): void;
  onError(message: string): void;
}

export function Composer({ text, file, disabled, onText, onFile, onSend, onGitHub, onError }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);

  function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (f) readAttachment(f).then(onFile, (err: Error) => onError(err.message));
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSend();
    }
  }

  return (
    <form
      className="composer"
      onSubmit={(e) => {
        e.preventDefault();
        onSend();
      }}
    >
      <div className="composer-box">
        {file && (
          <div className="attached">
            <span>📎 {file.name}</span>
            <button type="button" className="icon ghost" aria-label="Remove attachment" onClick={() => onFile(null)}>
              ✕
            </button>
          </div>
        )}
        <textarea
          rows={1}
          value={text}
          placeholder="Tell me about you, or what to change…"
          aria-label="Message"
          onChange={(e) => onText(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className="composer-actions">
          <Dropdown className="icon ghost" ariaLabel="Add a file or GitHub" disabled={disabled} placement="up-start" label={<PlusIcon />}>
            {(close) => (
              <>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    fileInput.current?.click();
                  }}
                >
                  Attach a CV or LinkedIn PDF
                </button>
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    close();
                    onGitHub();
                  }}
                >
                  Add my GitHub projects
                </button>
              </>
            )}
          </Dropdown>
          <button type="submit" className="icon primary send" aria-label="Send" disabled={disabled || (!text.trim() && !file)}>
            <SendIcon />
          </button>
        </div>
      </div>
      <input ref={fileInput} type="file" accept=".pdf,.txt,.md,application/pdf,text/plain" hidden onChange={pickFile} />
    </form>
  );
}
