export function Logo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#10b981" />
      <rect x="10" y="8" width="4" height="16" rx="1.5" fill="#fff" />
      <rect x="10" y="8" width="12" height="4" rx="1.5" fill="#fff" />
      <rect x="10" y="14.5" width="9" height="3.6" rx="1.5" fill="#fff" />
    </svg>
  );
}
