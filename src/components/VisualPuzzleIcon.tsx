import React from 'react';
import type { VisualItem } from '../types/game';

/**
 * Unambiguous, colorful vector illustrations for Einstein's Mystery visual puzzles.
 */
export const VisualPuzzleIcon: React.FC<{ item: VisualItem }> = ({ item }) => {
  const scale = item.scale ?? 1;
  const dots = item.patternDots;

  return (
    <div className="w-24 h-24 flex items-center justify-center">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        style={{ transform: `scale(${scale})` }}
        aria-hidden="true"
      >
        {item.visualType === 'apple' && (
          <g>
            <path d="M50 26 C32 24 20 42 24 62 C28 80 42 86 50 82 C58 86 72 80 76 62 C80 42 68 24 50 26 Z" fill="#EF4444" />
            <path d="M50 26 Q54 14 62 12" stroke="#78350F" strokeWidth="4" fill="none" strokeLinecap="round" />
            <ellipse cx="62" cy="18" rx="9" ry="5" fill="#22C55E" transform="rotate(-20 62 18)" />
            <ellipse cx="36" cy="44" rx="5" ry="9" fill="rgba(255,255,255,0.28)" transform="rotate(-18 36 44)" />
          </g>
        )}

        {item.visualType === 'mango' && (
          <g>
            <path d="M56 20 C34 22 22 46 28 68 C34 86 60 88 72 72 C82 58 76 20 56 20 Z" fill="#F59E0B" />
            <path d="M54 20 L58 10" stroke="#78350F" strokeWidth="4" strokeLinecap="round" />
            <ellipse cx="67" cy="16" rx="8" ry="4" fill="#16A34A" transform="rotate(20 67 16)" />
            <ellipse cx="42" cy="44" rx="5" ry="11" fill="rgba(255,255,255,0.28)" transform="rotate(-15 42 44)" />
          </g>
        )}

        {item.visualType === 'banana' && (
          <g>
            <path d="M22 68 C42 86 78 72 82 28 C72 52 46 66 22 68 Z" fill="#FACC15" stroke="#CA8A04" strokeWidth="3" strokeLinejoin="round" />
            <rect x="78" y="21" width="6" height="9" rx="2" fill="#78350F" transform="rotate(15 78 21)" />
          </g>
        )}

        {item.visualType === 'car' && (
          <g>
            <path d="M16 58 L24 38 L70 38 L82 54 L88 58 L88 72 L12 72 L12 58 Z" fill={item.color} />
            <polygon points="28,42 48,42 48,54 22,54" fill="#BAE6FD" />
            <polygon points="52,42 67,42 74,54 52,54" fill="#BAE6FD" />
            <circle cx="28" cy="74" r="10" fill="#1E293B" />
            <circle cx="28" cy="74" r="4" fill="#CBD5E1" />
            <circle cx="72" cy="74" r="10" fill="#1E293B" />
            <circle cx="72" cy="74" r="4" fill="#CBD5E1" />
          </g>
        )}

        {item.visualType === 'bus' && (
          <g>
            <rect x="10" y="30" width="80" height="42" rx="8" fill="#F59E0B" />
            <rect x="16" y="38" width="16" height="14" rx="2" fill="#E0F2FE" />
            <rect x="36" y="38" width="16" height="14" rx="2" fill="#E0F2FE" />
            <rect x="56" y="38" width="16" height="14" rx="2" fill="#E0F2FE" />
            <rect x="76" y="38" width="10" height="14" rx="2" fill="#E0F2FE" />
            <circle cx="28" cy="74" r="9" fill="#1E293B" />
            <circle cx="72" cy="74" r="9" fill="#1E293B" />
          </g>
        )}

        {item.visualType === 'bicycle' && (
          <g>
            <circle cx="26" cy="68" r="16" fill="none" stroke="#1E293B" strokeWidth="4" />
            <circle cx="74" cy="68" r="16" fill="none" stroke="#1E293B" strokeWidth="4" />
            <polyline points="26,68 46,42 74,68 46,68 26,68" fill="none" stroke="#10B981" strokeWidth="4" strokeLinejoin="round" />
            <line x1="66" y1="36" x2="78" y2="36" stroke="#1E293B" strokeWidth="4" strokeLinecap="round" />
            <line x1="70" y1="36" x2="74" y2="68" stroke="#10B981" strokeWidth="4" />
          </g>
        )}

        {item.visualType === 'boat' && (
          <g>
            <polygon points="50,14 50,60 80,60" fill="#F8FAFC" stroke="#0EA5E9" strokeWidth="2.5" />
            <polygon points="46,22 46,60 24,60" fill="#BAE6FD" />
            <path d="M14 64 L86 64 L74 82 L26 82 Z" fill="#0284C7" />
            <path d="M10 86 Q25 80 40 86 T70 86 T92 86" fill="none" stroke="#38BDF8" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {item.visualType === 'giraffe' && (
          <g>
            <rect x="44" y="18" width="12" height="44" rx="5" fill="#F59E0B" />
            <ellipse cx="52" cy="18" rx="11" ry="7" fill="#F59E0B" />
            <rect x="34" y="54" width="32" height="18" rx="8" fill="#F59E0B" />
            <rect x="38" y="70" width="5" height="20" rx="2" fill="#D97706" />
            <rect x="57" y="70" width="5" height="20" rx="2" fill="#D97706" />
            <circle cx="48" cy="34" r="3" fill="#92400E" />
            <circle cx="52" cy="46" r="3" fill="#92400E" />
            <circle cx="44" cy="62" r="3.5" fill="#92400E" />
            <circle cx="56" cy="16" r="2" fill="#1E293B" />
          </g>
        )}

        {item.visualType === 'fridge' && (
          <g>
            <rect x="26" y="16" width="48" height="72" rx="8" fill="#CBD5E1" stroke="#475569" strokeWidth="3" />
            <line x1="26" y1="42" x2="74" y2="42" stroke="#475569" strokeWidth="3" />
            <rect x="64" y="25" width="4" height="11" rx="2" fill="#475569" />
            <rect x="64" y="50" width="4" height="18" rx="2" fill="#475569" />
          </g>
        )}

        {item.visualType === 'lamp' && (
          <g>
            <polygon points="30,48 70,48 60,22 40,22" fill="#3B82F6" />
            <rect x="47" y="48" width="6" height="30" fill="#64748B" />
            <rect x="32" y="76" width="36" height="9" rx="4" fill="#334155" />
          </g>
        )}

        {item.visualType === 'whale' && (
          <g>
            <path d="M14 56 C14 32 48 26 70 42 C82 50 86 40 90 32 C92 48 86 64 70 68 C50 74 14 72 14 56 Z" fill="#0284C7" />
            <path d="M22 64 Q44 74 62 66" fill="#E0F2FE" />
            <circle cx="32" cy="50" r="3.2" fill="#FFFFFF" />
            <circle cx="32" cy="50" r="1.5" fill="#0F172A" />
          </g>
        )}

        {item.visualType === 'elephant' && (
          <g>
            <circle cx="32" cy="46" r="14" fill="#94A3B8" />
            <rect x="32" y="34" width="42" height="32" rx="14" fill="#64748B" />
            <path d="M24 54 Q16 74 26 76" fill="none" stroke="#64748B" strokeWidth="7" strokeLinecap="round" />
            <rect x="38" y="62" width="9" height="20" rx="3" fill="#475569" />
            <rect x="58" y="62" width="9" height="20" rx="3" fill="#475569" />
            <circle cx="30" cy="44" r="2.4" fill="#0F172A" />
          </g>
        )}

        {item.visualType === 'mouse' && (
          <g>
            <circle cx="36" cy="42" r="10" fill="#C084FC" />
            <circle cx="52" cy="42" r="10" fill="#C084FC" />
            <ellipse cx="52" cy="60" rx="22" ry="15" fill="#A855F7" />
            <circle cx="36" cy="58" r="2.5" fill="#0F172A" />
            <circle cx="29" cy="62" r="3" fill="#F472B6" />
            <path d="M74 62 Q88 58 84 46" fill="none" stroke="#A855F7" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {item.visualType === 'hexagon' && (
          <polygon
            points="50,12 83,31 83,69 50,88 17,69 17,31"
            fill={item.color}
            stroke="#FFFFFF"
            strokeWidth="3"
          />
        )}

        {item.visualType === 'triangle' && (
          <polygon
            points="50,14 86,82 14,82"
            fill={item.color}
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        )}

        {item.visualType === 'star' && (
          <polygon
            points="50,10 61,36 90,38 68,57 75,86 50,70 25,86 32,57 10,38 39,36"
            fill={item.color}
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        )}

        {item.visualType === 'square' && (
          <g>
            <rect x="14" y="14" width="72" height="72" rx="14" fill={item.color} />
            {typeof dots === 'number' &&
              Array.from({ length: dots }, (_, i) => {
                const coords: [number, number][] =
                  dots === 1
                    ? [[50, 50]]
                    : dots === 2
                    ? [[34, 50], [66, 50]]
                    : dots === 3
                    ? [[32, 34], [50, 50], [68, 66]]
                    : dots === 4
                    ? [[34, 34], [66, 34], [34, 66], [66, 66]]
                    : [[32, 32], [68, 32], [50, 50], [32, 68], [68, 68]];
                const [cx, cy] = coords[i] || [50, 50];
                return <circle key={i} cx={cx} cy={cy} r="7.5" fill="#FFFFFF" />;
              })}
          </g>
        )}
      </svg>
    </div>
  );
};
