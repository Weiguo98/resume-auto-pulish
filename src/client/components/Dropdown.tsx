import { useEffect, useRef, useState, type ReactNode } from "react";

interface Props {
  label: ReactNode;
  ariaLabel?: string;
  className?: string;
  disabled?: boolean;
  placement?: "down-start" | "down-end" | "up-start";
  children(close: () => void): ReactNode;
}

export function Dropdown({ label, ariaLabel, className = "", disabled, placement = "down-start", children }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const outside = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div className="dropdown" ref={root}>
      <button type="button" className={className} aria-label={ariaLabel} aria-expanded={open} disabled={disabled} onClick={() => setOpen(!open)}>
        {label}
      </button>
      {open && (
        <div className={`menu ${placement}`} role="menu">
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
