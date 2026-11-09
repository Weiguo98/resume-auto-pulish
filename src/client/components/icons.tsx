import type { ReactNode } from "react";

function Icon({ children, size = 16 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const PlusIcon = () => (
  <Icon>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);
export const SendIcon = () => (
  <Icon>
    <path d="M12 19V5M5 12l7-7 7 7" />
  </Icon>
);
export const ChevronIcon = () => (
  <Icon size={14}>
    <path d="m6 9 6 6 6-6" />
  </Icon>
);
export const UndoIcon = () => (
  <Icon>
    <path d="M9 14 4 9l5-5" />
    <path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" />
  </Icon>
);
export const DownloadIcon = () => (
  <Icon>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
  </Icon>
);
export const NewChatIcon = () => (
  <Icon>
    <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.4 2.6a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z" />
  </Icon>
);
export const CheckIcon = () => (
  <Icon size={14}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);
export const MonitorIcon = () => (
  <Icon>
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </Icon>
);
export const PhoneIcon = () => (
  <Icon>
    <rect width="14" height="20" x="5" y="2" rx="2" />
    <path d="M12 18h.01" />
  </Icon>
);
