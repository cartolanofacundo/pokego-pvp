// Íconos SVG copiados de las mesas de trabajo (tamaños y trazos exactos).

export function BoltIcon() {
  return (
    <svg width="9" height="11" viewBox="0 0 10 12" aria-hidden="true">
      <path d="M6 0L0 7h3.2L4 12l6-7H6.8z" fill="#9BA3AE" />
    </svg>
  );
}

export function ClockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="4.6" stroke="#9BA3AE" strokeWidth="1.4" />
      <path d="M6 3.4V6.2L7.8 7.3" stroke="#9BA3AE" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

export function WarningIcon({ size = 17, label }: { size?: number; label: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" role="img" aria-label={label} style={{ flexShrink: 0 }}>
      <path d="M9 2.6L16.2 15H1.8L9 2.6z" stroke="#FF6B6B" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M9 7.2v3.1" stroke="#FF6B6B" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="9" cy="12.4" r="0.85" fill="#FF6B6B" />
    </svg>
  );
}

export function PlusIcon({ size = 15, color = "#8B94A0", width = 1.7 }: { size?: number; color?: string; width?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 3v9M3 7.5h9" stroke={color} strokeWidth={width} strokeLinecap="round" />
    </svg>
  );
}

export function PlusIcon14() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 2.5v9M2.5 7h9" stroke="#F2F3F5" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M3 4.5L6 7.5L9 4.5" stroke="#9BA3AE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function GearIcon({ size = 19, color = "#F2F3F5" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M7.97 3.09 L8.06 1.06 L9.94 1.06 L10.03 3.09 L12.45 4.09 L13.95 2.72 L15.28 4.05 L13.91 5.55 L14.91 7.97 L16.94 8.06 L16.94 9.94 L14.91 10.03 L13.91 12.45 L15.28 13.95 L13.95 15.28 L12.45 13.91 L10.03 14.91 L9.94 16.94 L8.06 16.94 L7.97 14.91 L5.55 13.91 L4.05 15.28 L2.72 13.95 L4.09 12.45 L3.09 10.03 L1.06 9.94 L1.06 8.06 L3.09 7.97 L4.09 5.55 L2.72 4.05 L4.05 2.72 L5.55 4.09 Z"
        stroke={color}
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.5" stroke={color} strokeWidth="1.3" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="9" cy="9" r="5.6" stroke="#6FE3F2" strokeWidth="1.8" />
      <path d="M13.2 13.2L17 17" stroke="#6FE3F2" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function BackIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M9.5 3.5L5 8l4.5 4.5" stroke="#F2F3F5" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ResetIcon({ size = 15, color = "#C9CFD8" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8a5 5 0 1 1 1.6 3.7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2.4 4.6v3.2h3.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PencilIcon({ color = "#6B7480" }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M11.2 2.4l2.4 2.4-8 8H3.2v-2.4l8-8z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
