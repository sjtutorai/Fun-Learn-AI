import React, { useEffect, useState } from 'react';
import {
  Award,
  Calendar,
  Flame,
  Gamepad2,
  Gem,
  Gift,
  Home,
  LogIn,
  Menu,
  Settings,
  Sparkles,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { PlayerProvider, usePlayer } from './context/PlayerContext';
import { AvatarBadge } from './components/AvatarBadge';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { ScratchCardModal } from './components/ScratchCardModal';
import { computeLevelInfo } from './game/xpEngine';
import { THEME_CATALOG } from './data/assets';
import type { GameId, NavSection } from './types/game';
import { soundEngine } from './utils/soundEngine';

// Views
import { HomeView } from './views/HomeView';
import { PlayGamesView } from './views/PlayGamesView';
import { DailyChallengeView } from './views/DailyChallengeView';
import { RewardsView } from './views/RewardsView';
import { AchievementsView } from './views/AchievementsView';
import { LeaderboardView } from './views/LeaderboardView';
import { FriendsView } from './views/FriendsView';
import { ProfileView } from './views/ProfileView';
import { SettingsView } from './views/SettingsView';

// 5 Playable Game Engines
import { BrainBlastQuiz } from './games/BrainBlastQuiz';
import { MatchMasterGame } from './games/MatchMasterGame';
import { EinsteinMysteryGame } from './games/EinsteinMysteryGame';
import { WordWizardGame } from './games/WordWizardGame';
import { TreasureHuntGame } from './games/TreasureHuntGame';

const NAV_ITEMS: { id: NavSection; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'games', label: 'Play Games', icon: Gamepad2 },
  { id: 'daily', label: 'Daily Challenge', icon: Calendar },
  { id: 'rewards', label: 'Rewards', icon: Gift },
  { id: 'achievements', label: 'Achievements', icon: Award },
  { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  { id: 'friends', label: 'Friends', icon: Users },
  { id: 'profile', label: 'My Profile', icon: User },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const MOBILE_PRIMARY_NAV: NavSection[] = ['home', 'games', 'daily', 'friends'];

const VALID_SECTIONS = new Set<NavSection>(NAV_ITEMS.map((n) => n.id));
const VALID_GAMES = new Set<GameId>([
  'brain-blast',
  'match-master',
  'einstein-mystery',
  'word-wizard',
  'treasure-hunt',
]);

function getInitialRoute(): { section: NavSection; game: GameId | null } {
  if (typeof window === 'undefined') return { section: 'home', game: null };
  const params = new URLSearchParams(window.location.search);
  const rawSection = params.get('section') as NavSection | null;
  const rawGame = params.get('game') as GameId | null;
  return {
    section: rawSection && VALID_SECTIONS.has(rawSection) ? rawSection : 'home',
    game: rawGame && VALID_GAMES.has(rawGame) ? rawGame : null,
  };
}

const FunLearnShell: React.FC = () => {
  const {
    player,
    firebaseUser,
    isOffline,
    signIn,
    updateAudio,
  } = usePlayer();

  const initialRoute = getInitialRoute();
  const [section, setSection] = useState<NavSection>(initialRoute.section);
  const [activeGame, setActiveGame] = useState<GameId | null>(initialRoute.game);
  const [activePackId, setActivePackId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const levelInfo = computeLevelInfo(player.xp);
  const activeTheme =
    THEME_CATALOG.find((t) => t.id === player.themeId)?.className || 'theme-sky';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [section, activeGame]);

  const handleNavigate = (target: NavSection) => {
    soundEngine.playClick();
    setActiveGame(null);
    setActivePackId(null);
    setSection(target);
    setMobileMenuOpen(false);
  };

  const handleLaunchGame = (gameId: GameId, packId?: string) => {
    soundEngine.playClick();
    setActivePackId(packId ?? null);
    setActiveGame(gameId);
    setMobileMenuOpen(false);
  };

  const handleExitGame = () => {
    soundEngine.playClick();
    setActiveGame(null);
    setActivePackId(null);
  };

  const getBadgeCount = (id: NavSection): number => {
    if (id === 'rewards') return player.pendingScratchCards.length;
    if (id === 'friends') return player.incomingRequests.length;
    if (id === 'games') return player.offlineSyncQueue.length;
    return 0;
  };

  return (
    <div className={`${activeTheme} app-canvas-bg min-h-screen flex flex-col lg:flex-row text-slate-900`}>
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-white/90 border-r-2 border-slate-200/80 sticky top-0 h-screen p-4 justify-between z-20">
        <div className="space-y-5 overflow-y-auto">
          {/* Brand Crest */}
          <button
            type="button"
            onClick={() => handleNavigate('home')}
            className="w-full flex items-center gap-3 px-2 py-1 text-left group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 via-sky-500 to-amber-400 text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="font-display text-xl font-bold tracking-tight text-slate-900 block leading-none">
                FUNLEARN AI
              </span>
              <span className="text-[11px] font-bold text-blue-600">
                Think Smart · Play Hard
              </span>
            </div>
          </button>

          {/* Navigation Items */}
          <nav aria-label="Main navigation" className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = !activeGame && section === item.id;
              const badge = getBadgeCount(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavigate(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full rounded-2xl px-3.5 py-2.5 flex items-center justify-between gap-2 font-display text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {badge > 0 && (
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[11px] font-mono font-bold tabular-nums shrink-0 ${
                        isActive ? 'bg-white/25 text-white' : 'bg-orange-500 text-white'
                      }`}
                    >
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Compact Player Card */}
        <button
          type="button"
          onClick={() => handleNavigate('profile')}
          className="mt-4 rounded-2xl bg-slate-50 hover:bg-blue-50 border border-slate-200 p-3 flex items-center gap-3 text-left transition-colors"
        >
          <AvatarBadge
            avatarId={player.avatarId}
            accessoryId={player.accessoryId}
            size="sm"
          />
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-slate-900 truncate">
              {player.nickname}
            </p>
            <p className="text-[11px] font-bold text-blue-600 truncate">
              Lv.{levelInfo.level} · {levelInfo.title}
            </p>
          </div>
        </button>
      </aside>

      {/* Main Column: Top HUD + Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Compact Single-Row Top HUD */}
        <header className="sticky top-0 z-20 bg-white/92 backdrop-blur-md border-b-2 border-slate-200/80 px-4 sm:px-6 py-2.5">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            {/* Mobile Brand */}
            <button
              type="button"
              onClick={() => handleNavigate('home')}
              className="flex lg:hidden items-center gap-2 shrink-0"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-amber-400 text-white flex items-center justify-center shadow-sm">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-display text-base font-bold text-slate-900 whitespace-nowrap">
                FUNLEARN AI
              </span>
            </button>

            {/* Desktop Context Title / Offline Alert */}
            <div className="hidden lg:flex items-center gap-2.5 min-w-0">
              <span className="font-display text-sm font-bold text-slate-500">
                {activeGame ? 'Now Playing' : NAV_ITEMS.find((n) => n.id === section)?.label}
              </span>
              {isOffline && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 border border-amber-300 px-2.5 py-1 text-xs font-bold text-amber-900 whitespace-nowrap">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Offline Mode</span>
                </span>
              )}
            </div>

            {/* Compact Right HUD Counters */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {isOffline && (
                <span className="lg:hidden inline-flex items-center gap-1 rounded-xl bg-amber-100 border border-amber-300 px-2 py-1 text-[11px] font-bold text-amber-900">
                  <WifiOff className="w-3 h-3" />
                </span>
              )}

              <div
                className="rounded-xl bg-blue-50 border border-blue-200 px-2.5 py-1.5 flex items-center gap-1.5 text-xs font-bold text-blue-800 whitespace-nowrap tabular-nums"
                title={`Level ${levelInfo.level}: ${levelInfo.title}`}
              >
                <Zap className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{player.xp} XP</span>
              </div>

              <div className="hidden sm:flex rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 items-center gap-1.5 text-xs font-bold text-emerald-800 whitespace-nowrap tabular-nums">
                <Gem className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{player.gems}</span>
              </div>

              <div className="rounded-xl bg-orange-50 border border-orange-200 px-2.5 py-1.5 flex items-center gap-1 text-xs font-bold text-orange-800 whitespace-nowrap tabular-nums">
                <Flame className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span>{player.streak}d</span>
              </div>

              <button
                type="button"
                onClick={() => updateAudio({ soundEnabled: !player.audio.soundEnabled })}
                aria-label={player.audio.soundEnabled ? 'Mute sound effects' : 'Unmute sound effects'}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 shrink-0"
              >
                {player.audio.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {!firebaseUser ? (
                <button
                  type="button"
                  onClick={() => signIn()}
                  className="hidden md:inline-flex btn-3d rounded-xl bg-blue-600 border-b-2 border-blue-800 px-3 py-1.5 font-display text-xs font-bold text-white items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Cloud Save</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleNavigate('profile')}
                  aria-label="Open My Profile"
                  className="hidden md:inline-flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-2 py-1"
                >
                  <AvatarBadge
                    avatarId={player.avatarId}
                    accessoryId={player.accessoryId}
                    size="sm"
                    className="!w-7 !h-7 !rounded-lg"
                  />
                  <span className="font-display text-xs font-bold text-slate-800 max-w-[100px] truncate">
                    {player.nickname}
                  </span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Active Content / Game Stage */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeGame === 'brain-blast' ? (
            <BrainBlastQuiz onExit={handleExitGame} initialPackId={activePackId} />
          ) : activeGame === 'match-master' ? (
            <MatchMasterGame onExit={handleExitGame} />
          ) : activeGame === 'einstein-mystery' ? (
            <EinsteinMysteryGame onExit={handleExitGame} />
          ) : activeGame === 'word-wizard' ? (
            <WordWizardGame onExit={handleExitGame} />
          ) : activeGame === 'treasure-hunt' ? (
            <TreasureHuntGame onExit={handleExitGame} />
          ) : section === 'home' ? (
            <HomeView onNavigate={handleNavigate} onLaunchGame={handleLaunchGame} />
          ) : section === 'games' ? (
            <PlayGamesView onLaunchGame={handleLaunchGame} />
          ) : section === 'daily' ? (
            <DailyChallengeView />
          ) : section === 'rewards' ? (
            <RewardsView />
          ) : section === 'achievements' ? (
            <AchievementsView />
          ) : section === 'leaderboard' ? (
            <LeaderboardView />
          ) : section === 'friends' ? (
            <FriendsView />
          ) : section === 'profile' ? (
            <ProfileView />
          ) : (
            <SettingsView />
          )}
        </main>
      </div>

      {/* Mobile Compact Bottom Navigation Bar (<= 64px height) */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white/96 backdrop-blur-md border-t-2 border-slate-200 px-2 py-1.5 grid grid-cols-5 gap-1"
      >
        {MOBILE_PRIMARY_NAV.map((navId) => {
          const item = NAV_ITEMS.find((n) => n.id === navId)!;
          const Icon = item.icon;
          const active = !activeGame && section === item.id;
          const badge = getBadgeCount(item.id);
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavigate(item.id)}
              className={`relative rounded-xl py-1.5 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
                active ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-full">
                {item.id === 'daily' ? 'Daily' : item.id === 'games' ? 'Games' : item.label}
              </span>
              {badge > 0 && (
                <span className="absolute top-1 right-3 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setMobileMenuOpen((v) => !v)}
          aria-expanded={mobileMenuOpen}
          className={`rounded-xl py-1.5 flex flex-col items-center justify-center gap-0.5 text-[11px] font-bold ${
            mobileMenuOpen ? 'text-blue-600 bg-blue-50' : 'text-slate-600'
          }`}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          <span>More</span>
        </button>
      </nav>

      {/* Mobile More Drawer */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs flex items-end"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-full bg-white rounded-t-3xl p-5 pb-8 space-y-4 animate-fun-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-slate-900">
                Explore All Sections
              </span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close navigation drawer"
                className="p-2 rounded-xl bg-slate-100 text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {NAV_ITEMS.filter((i) => !MOBILE_PRIMARY_NAV.includes(i.id)).map((item) => {
                const Icon = item.icon;
                const badge = getBadgeCount(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`rounded-2xl border-2 px-4 py-3 flex items-center justify-between gap-2 font-display text-sm font-bold ${
                      section === item.id && !activeGame
                        ? 'bg-blue-600 text-white border-blue-800'
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {badge > 0 && (
                      <span className="rounded-lg bg-orange-500 text-white px-1.5 py-0.5 text-[11px] font-mono">
                        {badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Global Overlays */}
      <CelebrationOverlay />
      <ScratchCardModal />
    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <PlayerProvider>
        <FunLearnShell />
      </PlayerProvider>
    </ErrorBoundary>
  );
}

export default App;
