import { useState, type FormEvent } from "react";

interface Props {
  disabled: boolean;
  onTailor(jd: string): void;
  onClose(): void;
}

export function TailorPanel({ disabled, onTailor, onClose }: Props) {
  const [jd, setJd] = useState("");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!jd.trim()) return setError("Paste the job description or a link first.");
    onTailor(jd.trim());
  }

  return (
    <form className="import" onSubmit={submit}>
      <div className="import-head">
        <h3>Tailor for a job</h3>
        <button type="button" className="close" aria-label="Close" onClick={onClose}>
          ✕
        </button>
      </div>
      <p className="hint">
        Paste the job description or a link to the job post. I make a new CV from your main one. I only reorder, hide and reword what is already there. Your main CV
        stays the same.
      </p>
      <textarea
        aria-label="Job description"
        rows={8}
        placeholder="Paste the job description, or a link like https://jobs.example.com/123"
        value={jd}
        onChange={(e) => {
          setJd(e.target.value);
          setError("");
        }}
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" className="primary" disabled={disabled}>
        Tailor my CV
      </button>
    </form>
  );
}
