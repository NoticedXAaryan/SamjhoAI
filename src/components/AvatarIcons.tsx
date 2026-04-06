import { memo } from 'react';

/* Playful avatars inspired by Google Play / Discord style.
   Each is a small SVG-style inline component. Add more to the
   array as needed (aim for 16+ options). */

const AVATARS: ((color: string) => React.ReactNode)[] = [
  // 0 — Cat
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <polygon points="6,12 12,2 16,10" fill={c} />
      <polygon points="30,12 24,2 20,10" fill={c} />
      <circle cx="13" cy="17" r="2" fill="#fff" />
      <circle cx="23" cy="17" r="2" fill="#fff" />
      <ellipse cx="18" cy="22" rx="2" ry="1" fill="#fff" />
    </svg>
  ),
  // 1 — Dog
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <ellipse cx="9" cy="14" rx="6" ry="8" fill={c} />
      <ellipse cx="27" cy="14" rx="6" ry="8" fill={c} />
      <circle cx="13" cy="17" r="2" fill="#fff" />
      <circle cx="23" cy="17" r="2" fill="#fff" />
      <ellipse cx="18" cy="24" rx="3" ry="2" fill="#fff" />
    </svg>
  ),
  // 2 — Star
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <polygon points="18,5 22,14 32,14 24,20 27,30 18,24 9,30 12,20 4,14 14,14" fill="#fff" />
    </svg>
  ),
  // 3 — Crown
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <polygon points="6,26 6,12 12,18 18,8 24,18 30,12 30,26" fill="#fff" />
    </svg>
  ),
  // 4 — Ghost
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M10,27 C10,12 26,12 26,27 L23,24 L20,27 L17,24 L14,27 L11,24 Z" fill="#fff" />
      <circle cx="15" cy="18" r="2" fill={c} />
      <circle cx="21" cy="18" r="2" fill={c} />
    </svg>
  ),
  // 5 — Rocket
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M18,6 Q24,14 24,22 L26,28 L18,24 L10,28 L12,22 Q12,14 18,6Z" fill="#fff" />
      <circle cx="18" cy="17" r="3" fill={c} />
    </svg>
  ),
  // 6 — Heart
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M18,28 L6,17 Q4,12 8,9 Q12,6 18,14 Q24,6 28,9 Q32,12 30,17 Z" fill="#fff" />
    </svg>
  ),
  // 7 — Lightning
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <polygon points="22,6 14,18 20,18 14,30 26,16 20,16" fill="#fff" />
    </svg>
  ),
  // 8 — Diamond
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <polygon points="18,6 28,16 18,30 8,16" fill="#fff" />
    </svg>
  ),
  // 9 — Moon
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M22,8 A10,10,0,1,0,22,28 A7,7,0,1,1,22,8Z" fill="#fff" />
    </svg>
  ),
  // 10 — Sun
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <circle cx="18" cy="18" r="6" fill="#fff" />
      <line x1="18" y1="4" x2="18" y2="9" stroke="#fff" strokeWidth="2" />
      <line x1="18" y1="27" x2="18" y2="32" stroke="#fff" strokeWidth="2" />
      <line x1="4" y1="18" x2="9" y2="18" stroke="#fff" strokeWidth="2" />
      <line x1="27" y1="18" x2="32" y2="18" stroke="#fff" strokeWidth="2" />
    </svg>
  ),
  // 11 — Fire
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M18,4 Q28,14 26,22 Q24,28 18,28 Q12,28 10,22 Q8,14 18,4Z" fill="#fff" />
    </svg>
  ),
  // 12 — Music Note
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <ellipse cx="14" cy="25" rx="5" ry="3.5" fill="#fff" />
      <rect x="17" y="10" width="2.5" height="15" fill="#fff" />
      <path d="M19.5,10 L28,7 L28,15 L19.5,18Z" fill="#fff" />
    </svg>
  ),
  // 13 — Flower
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <circle cx="18" cy="12" r="4" fill="#fff" />
      <circle cx="12" cy="16" r="4" fill="#fff" />
      <circle cx="24" cy="16" r="4" fill="#fff" />
      <circle cx="14" cy="22" r="4" fill="#fff" />
      <circle cx="22" cy="22" r="4" fill="#fff" />
    </svg>
  ),
  // 14 — Alien
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <ellipse cx="18" cy="16" rx="9" ry="10" fill="#fff" />
      <ellipse cx="13" cy="14" rx="3" ry="4" fill={c} />
      <ellipse cx="23" cy="14" rx="3" ry="4" fill={c} />
      <ellipse cx="18" cy="21" rx="2" ry="1" fill={c} />
    </svg>
  ),
  // 15 — Puzzle
  (c) => (
    <svg viewBox="0 0 36 36" className="w-full h-full">
      <circle cx="18" cy="18" r="18" fill={c} />
      <path d="M11,10 L21,10 Q21,7 24,7 Q27,7 27,10 L30,10 L30,28 L27,28 Q27,31 24,31 Q21,31 21,28 L11,28 Q11,25 8,25 Q5,25 5,28 L5,14 Q5,11 8,11" fill="#fff" />
    </svg>
  ),
];

const COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#6366f1',
  '#f97316', '#14b8a6', '#a855f7', '#e11d48',
  '#0ea5e9', '#84cc16', '#d946ef', '#059669',
];

function getAvatarSvg(avatarId: number, name: string, size = 36): React.ReactElement {
  const idx = Math.abs(avatarId) % AVATARS.length;
  const colorIdx = (name.charCodeAt(0) || 0) % COLORS.length;
  const base = (
    <svg viewBox="0 0 36 36" width={size} height={size} className="rounded-full">
      {AVATARS[idx](COLORS[colorIdx])}
    </svg>
  );
  // SVG with className is already an element — wrap it
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}>
      {base.props.children}
    </div>
  );
}

/* Render a full 36x36 avatar SVG from the preset library */
export const AvatarIcon = memo(({ avatarId, name, size = 36 }: {
  avatarId?: number; name: string; size?: number;
}) => {
  const id = avatarId ?? Math.abs(name.charCodeAt(0)) % AVATARS.length;
  const colorIdx = (name.charCodeAt(0) || 0) % COLORS.length;
  return (
    <svg viewBox="0 0 36 36" width={size} height={size} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}>
      {AVATARS[id](COLORS[colorIdx])}
    </svg>
  );
});
AvatarIcon.displayName = 'AvatarIcon';

/* Picker UI for picking an avatar */
export const AvatarPicker = memo(({ currentId, onSelect }: {
  currentId: number;
  onSelect: (id: number) => void;
}) => {
  const name = 'A'; // color is deterministic
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
      {AVATARS.map((_, i) => {
        const colorIdx = (name.charCodeAt(0) || 0) % COLORS.length;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`w-12 h-12 rounded-xl transition-all hover:scale-110 active:scale-95 ${
              currentId === i
                ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-105'
                : 'opacity-70 hover:opacity-100'
            }`}
          >
            <svg viewBox="0 0 36 36" style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', width: '100%', height: '100%' }}>
              {AVATARS[i](COLORS[colorIdx])}
            </svg>
          </button>
        );
      })}
    </div>
  );
});
AvatarPicker.displayName = 'AvatarPicker';
