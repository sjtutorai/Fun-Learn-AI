import React from 'react';
import { AVATAR_CATALOG } from '../data/assets';

interface AvatarBadgeProps {
  avatarId: string;
  accessoryId?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const SIZE_MAP = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-28 h-28',
};

export const AvatarBadge: React.FC<AvatarBadgeProps> = ({
  avatarId,
  accessoryId = 'none',
  size = 'md',
  className = '',
}) => {
  const def = AVATAR_CATALOG.find((a) => a.id === avatarId) || AVATAR_CATALOG[0];

  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-br ${def.bg} ${SIZE_MAP[size]} flex items-center justify-center shadow-md border-2 border-white overflow-hidden shrink-0 ${className}`}
      aria-label={`${def.name} avatar`}
    >
      <svg viewBox="0 0 80 80" className="w-full h-full">
        {/* Soft background sheen */}
        <circle cx="40" cy="40" r="36" fill="rgba(255,255,255,0.12)" />

        {/* Ears / Character Base */}
        {def.species === 'owl' && (
          <>
            <polygon points="18,22 28,16 26,32" fill="#D97706" />
            <polygon points="62,22 52,16 54,32" fill="#D97706" />
            <circle cx="40" cy="45" r="24" fill="#FDE68A" />
            <circle cx="31" cy="43" r="9" fill="#FFFFFF" stroke="#92400E" strokeWidth="2" />
            <circle cx="49" cy="43" r="9" fill="#FFFFFF" stroke="#92400E" strokeWidth="2" />
            <circle cx="31" cy="43" r="4" fill="#1E293B" />
            <circle cx="49" cy="43" r="4" fill="#1E293B" />
            <polygon points="36,51 44,51 40,59" fill="#F59E0B" />
          </>
        )}

        {def.species === 'panda' && (
          <>
            <circle cx="20" cy="24" r="9" fill="#1E293B" />
            <circle cx="60" cy="24" r="9" fill="#1E293B" />
            <circle cx="40" cy="46" r="24" fill="#FFFFFF" />
            <ellipse cx="30" cy="44" rx="7" ry="8" fill="#1E293B" />
            <ellipse cx="50" cy="44" rx="7" ry="8" fill="#1E293B" />
            <circle cx="30" cy="43" r="2.5" fill="#FFFFFF" />
            <circle cx="50" cy="43" r="2.5" fill="#FFFFFF" />
            <ellipse cx="40" cy="53" rx="4" ry="3" fill="#1E293B" />
            <path d="M34 58 Q40 63 46 58" fill="none" stroke="#1E293B" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {def.species === 'dragon' && (
          <>
            <polygon points="22,26 16,12 31,20" fill="#15803D" />
            <polygon points="58,26 64,12 49,20" fill="#15803D" />
            <circle cx="40" cy="46" r="23" fill="#86EFAC" />
            <circle cx="31" cy="42" r="5" fill="#FFFFFF" />
            <circle cx="49" cy="42" r="5" fill="#FFFFFF" />
            <circle cx="32" cy="42" r="2.5" fill="#14532D" />
            <circle cx="50" cy="42" r="2.5" fill="#14532D" />
            <circle cx="36" cy="52" r="2" fill="#15803D" />
            <circle cx="44" cy="52" r="2" fill="#15803D" />
            <path d="M32 58 Q40 64 48 58" fill="none" stroke="#14532D" strokeWidth="2.5" strokeLinecap="round" />
          </>
        )}

        {def.species === 'robot' && (
          <>
            <line x1="40" y1="12" x2="40" y2="23" stroke="#FDE047" strokeWidth="3" strokeLinecap="round" />
            <circle cx="40" cy="11" r="4" fill="#FDE047" />
            <rect x="17" y="23" width="46" height="42" rx="12" fill="#E0F2FE" stroke="#0284C7" strokeWidth="2.5" />
            <rect x="23" y="32" width="34" height="16" rx="6" fill="#0F172A" />
            <circle cx="32" cy="40" r="4" fill="#38BDF8" />
            <circle cx="48" cy="40" r="4" fill="#38BDF8" />
            <path d="M32 56 L48 56" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" />
          </>
        )}

        {def.species === 'astro-fox' && (
          <>
            <polygon points="18,32 22,12 35,24" fill="#EA580C" />
            <polygon points="62,32 58,12 45,24" fill="#EA580C" />
            <circle cx="40" cy="46" r="23" fill="#FB923C" />
            <path d="M22 48 Q40 68 58 48 Q40 54 22 48 Z" fill="#FFF7ED" />
            <circle cx="31" cy="42" r="4" fill="#1E293B" />
            <circle cx="49" cy="42" r="4" fill="#1E293B" />
            <circle cx="30" cy="40.5" r="1.5" fill="#FFFFFF" />
            <circle cx="48" cy="40.5" r="1.5" fill="#FFFFFF" />
            <circle cx="40" cy="51" r="3" fill="#1E293B" />
          </>
        )}

        {def.species === 'explorer' && (
          <>
            <path d="M18 36 Q20 14 40 16 Q60 14 62 36 Z" fill="#78350F" />
            <circle cx="40" cy="46" r="22" fill="#FDE68A" />
            <circle cx="31" cy="45" r="3.6" fill="#1E293B" />
            <circle cx="49" cy="45" r="3.6" fill="#1E293B" />
            <circle cx="25" cy="51" r="3" fill="#FCA5A5" opacity="0.65" />
            <circle cx="55" cy="51" r="3" fill="#FCA5A5" opacity="0.65" />
            <path d="M33 54 Q40 61 47 54" fill="none" stroke="#92400E" strokeWidth="2.8" strokeLinecap="round" />
          </>
        )}

        {/* Approved Virtual Accessories */}
        {accessoryId === 'goggles' && (
          <g>
            <rect x="19" y="21" width="42" height="7" rx="3" fill="#92400E" />
            <circle cx="31" cy="24" r="7.5" fill="#38BDF8" stroke="#F59E0B" strokeWidth="2.8" />
            <circle cx="49" cy="24" r="7.5" fill="#38BDF8" stroke="#F59E0B" strokeWidth="2.8" />
          </g>
        )}

        {accessoryId === 'crown' && (
          <polygon
            points="24,22 27,8 35,16 40,6 45,16 53,8 56,22"
            fill="#FACC15"
            stroke="#CA8A04"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        )}

        {accessoryId === 'wizard-hat' && (
          <g>
            <ellipse cx="40" cy="23" rx="26" ry="5" fill="#4F46E5" />
            <polygon points="24,22 40,2 56,22" fill="#6366F1" />
            <circle cx="40" cy="14" r="2.6" fill="#FDE047" />
          </g>
        )}

        {accessoryId === 'star-shades' && (
          <g>
            <rect x="21" y="38" width="16" height="10" rx="4" fill="#F59E0B" stroke="#92400E" strokeWidth="2" />
            <rect x="43" y="38" width="16" height="10" rx="4" fill="#F59E0B" stroke="#92400E" strokeWidth="2" />
            <line x1="37" y1="43" x2="43" y2="43" stroke="#92400E" strokeWidth="2.5" />
          </g>
        )}

        {accessoryId === 'headphones' && (
          <g>
            <path d="M16 44 Q16 14 40 14 Q64 14 64 44" fill="none" stroke="#EF4444" strokeWidth="4.5" strokeLinecap="round" />
            <rect x="11" y="37" width="8" height="16" rx="4" fill="#EF4444" />
            <rect x="61" y="37" width="8" height="16" rx="4" fill="#EF4444" />
          </g>
        )}
      </svg>
    </div>
  );
};
