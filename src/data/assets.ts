export const ART_ASSETS = {
  heroExplorer: '/src/assets/images/hero_mascot_explorer_1795571424976.jpg',
  brainBlast: '/src/assets/images/game_brain_blast_1795571424325.jpg',
  matchMaster: '/src/assets/images/game_match_master_1795571424455.jpg',
  einsteinMystery: '/src/assets/images/game_einstein_mystery_1795571422952.jpg',
  wordWizard: '/src/assets/images/game_word_wizard_1795571424123.jpg',
  treasureMap: '/src/assets/images/world_treasure_map_1795571424539.jpg',
} as const;

export interface AvatarDef {
  id: string;
  name: string;
  bg: string;
  faceColor: string;
  accent: string;
  species: 'explorer' | 'owl' | 'panda' | 'dragon' | 'astro-fox' | 'robot';
  unlockedByDefault: boolean;
}

export const AVATAR_CATALOG: AvatarDef[] = [
  {
    id: 'explorer-kid',
    name: 'Sky Explorer',
    bg: 'from-sky-400 to-blue-600',
    faceColor: '#FDE68A',
    accent: '#2563EB',
    species: 'explorer',
    unlockedByDefault: true,
  },
  {
    id: 'professor-owl',
    name: 'Professor Hoot',
    bg: 'from-amber-400 to-orange-500',
    faceColor: '#FEF3C7',
    accent: '#D97706',
    species: 'owl',
    unlockedByDefault: true,
  },
  {
    id: 'genius-panda',
    name: 'Bamboo Brain',
    bg: 'from-emerald-400 to-teal-600',
    faceColor: '#FFFFFF',
    accent: '#059669',
    species: 'panda',
    unlockedByDefault: true,
  },
  {
    id: 'spark-dragon',
    name: 'Word Dragon',
    bg: 'from-lime-400 to-emerald-600',
    faceColor: '#BBF7D0',
    accent: '#16A34A',
    species: 'dragon',
    unlockedByDefault: true,
  },
  {
    id: 'robo-buddy',
    name: 'Bolt Bot',
    bg: 'from-cyan-400 to-indigo-600',
    faceColor: '#E0F2FE',
    accent: '#0284C7',
    species: 'robot',
    unlockedByDefault: true,
  },
  {
    id: 'astro-fox',
    name: 'Astro Fox',
    bg: 'from-fuchsia-500 to-indigo-600',
    faceColor: '#FDBA74',
    accent: '#C026D3',
    species: 'astro-fox',
    unlockedByDefault: false,
  },
];

export interface AccessoryDef {
  id: string;
  name: string;
  description: string;
}

export const ACCESSORY_CATALOG: AccessoryDef[] = [
  { id: 'none', name: 'Classic Look', description: 'Clean natural avatar look' },
  { id: 'goggles', name: 'Explorer Goggles', description: 'Ready for airship adventures' },
  { id: 'wizard-hat', name: 'Wizard Hat', description: 'Enchanted spelling powers' },
  { id: 'crown', name: 'Genius Crown', description: 'Golden champion crown' },
  { id: 'star-shades', name: 'Star Glasses', description: 'Bright golden thinking specs' },
  { id: 'headphones', name: 'Quiz Beats', description: 'Studio focus headphones' },
];

export interface ThemeDef {
  id: string;
  name: string;
  className: string;
  preview: string;
  unlockedByDefault: boolean;
}

export const THEME_CATALOG: ThemeDef[] = [
  {
    id: 'sky',
    name: 'Sunny Sky Island',
    className: 'theme-sky',
    preview: 'linear-gradient(135deg, #38BDF8 0%, #FDE047 100%)',
    unlockedByDefault: true,
  },
  {
    id: 'jungle',
    name: 'Emerald Forest',
    className: 'theme-jungle',
    preview: 'linear-gradient(135deg, #34D399 0%, #A3E635 100%)',
    unlockedByDefault: true,
  },
  {
    id: 'candy',
    name: 'Sunset Carnival',
    className: 'theme-candy',
    preview: 'linear-gradient(135deg, #FB7185 0%, #FBBF24 100%)',
    unlockedByDefault: true,
  },
  {
    id: 'galaxy',
    name: 'Galaxy Quest',
    className: 'theme-galaxy',
    preview: 'linear-gradient(135deg, #6366F1 0%, #22D3EE 100%)',
    unlockedByDefault: false,
  },
];
