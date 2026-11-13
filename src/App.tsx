import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Compass,
  Home,
  Search,
  User,
  WifiOff,
  CheckSquare,
} from 'lucide-react';
import { AppProvider, useAppStore } from './hooks/useAppStore';
import { useQuranAudioPlayer } from './hooks/useAudioPlayer';
import { HomeDashboard } from './pages/HomeDashboard';
import { QuranModule } from './pages/QuranModule';
import { NamazModule } from './pages/NamazModule';
import { ToolsModule } from './pages/ToolsModule';
import { ProfileSettingsModule } from './pages/ProfileSettingsModule';
import { LocationSelectorModal } from './components/LocationSelectorModal';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { AppTab } from './types';

const NoorLifeShell: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    setActiveToolId,
    setIsSearchOpen,
    isOnline,
    toasts,
    t,
  } = useAppStore();

  const audioPlayer = useQuranAudioPlayer();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 750);
    return () => clearTimeout(timer);
  }, []);

  const navItems: Array<{ id: AppTab; labelBn: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'home', labelBn: 'হোম', labelEn: 'Home', icon: Home },
    { id: 'quran', labelBn: 'কুরআন', labelEn: 'Quran', icon: BookOpen },
    { id: 'namaz', labelBn: 'নামাজ', labelEn: 'Salah', icon: CheckSquare },
    { id: 'tools', labelBn: 'টুলস', labelEn: 'Tools', icon: Compass },
    { id: 'profile', labelBn: 'প্রোফাইল', labelEn: 'Profile', icon: User },
  ];

  const handleNavClick = (tab: AppTab) => {
    if (tab === 'tools') {
      setActiveToolId(null);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F7F9FF] dark:bg-[#10182B] text-[#10182B] dark:text-[#F1F5F9] pb-24 lg:pb-10 transition-colors">
      {/* Splash Screen Arrival Overlay */}
      {showSplash && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-[#10182B] flex flex-col items-center justify-center p-6 transition-opacity duration-300">
          <img
            src="/assets/aistudio/file_0000000007a481fa9c9f1918a2ee7c16_192e84d1.png"
            alt="NOOR LIFE"
            referrerPolicy="no-referrer"
            className="w-40 h-52 object-contain"
          />
          <p className="text-sm font-semibold text-[#2457D6] dark:text-[#60A5FA] mt-3">
            নূর লাইফ · আপনার সম্পূর্ণ ইসলামিক জীবনসঙ্গী
          </p>
        </div>
      )}

      {/* Clean 3-Zone Top Navigation Bar */}
      <header className="sticky top-0 z-30 h-14 bg-white/90 dark:bg-[#10182B]/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 whitespace-nowrap shrink-0 text-left"
          >
            <img
              src="/icon.svg"
              alt="নূর লাইফ"
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-lg shrink-0"
            />
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#10182B] dark:text-white">
              নূর লাইফ
            </span>
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`py-1 whitespace-nowrap shrink-0 transition-colors border-b-2 ${
                    active
                      ? 'text-[#2457D6] dark:text-[#60A5FA] border-[#D92735]'
                      : 'text-slate-600 dark:text-slate-300 border-transparent hover:text-[#10182B] dark:hover:text-white'
                  }`}
                >
                  {t(item.labelBn, item.labelEn)}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Search Action */}
          <div className="shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] hover:bg-[#1E47B8] text-white px-3.5 py-2 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
            >
              <Search className="w-4 h-4" />
              <span>{t('অনুসন্ধান', 'Search')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Honest Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-white text-xs font-semibold px-4 py-2 text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>
            {t(
              'আপনি বর্তমানে অফলাইনে আছেন — সংরক্ষিত কুরআন, নামাজের সময়সূচি, তাসবিহ ও দোয়া ব্যবহার করা যাচ্ছে।',
              'You are offline — cached Quran, prayer times, Tasbih & Duas remain available.'
            )}
          </span>
        </div>
      )}

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-7">
        {activeTab === 'home' && (
          <HomeDashboard onOpenLocationModal={() => setShowLocationModal(true)} />
        )}
        {activeTab === 'quran' && <QuranModule audioPlayer={audioPlayer} />}
        {activeTab === 'namaz' && (
          <NamazModule onOpenLocationModal={() => setShowLocationModal(true)} />
        )}
        {activeTab === 'tools' && (
          <ToolsModule onOpenLocationModal={() => setShowLocationModal(true)} />
        )}
        {activeTab === 'profile' && (
          <ProfileSettingsModule onOpenLocationModal={() => setShowLocationModal(true)} />
        )}
      </main>

      {/* Fixed Bottom Navigation Bar on Mobile (<=15% viewport height) */}
      <nav
        aria-label="প্রধান নেভিগেশন"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#10182B]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe"
      >
        <div className="grid grid-cols-5 items-center h-16">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  active
                    ? 'text-[#2457D6] dark:text-[#60A5FA]'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
                <span className="text-[11px] font-semibold tracking-tight mt-1 whitespace-nowrap">
                  {t(item.labelBn, item.labelEn)}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        currentTrack={audioPlayer.currentTrack}
        isPlaying={audioPlayer.isPlaying}
        isLoading={audioPlayer.isLoading}
        progress={audioPlayer.progress}
        duration={audioPlayer.duration}
        repeatMode={audioPlayer.repeatMode}
        onTogglePlay={audioPlayer.togglePlay}
        onNext={audioPlayer.playNext}
        onPrev={audioPlayer.playPrev}
        onSeek={audioPlayer.seekTo}
        onToggleRepeat={() =>
          audioPlayer.setRepeatMode((m) =>
            m === 'none' ? 'one' : m === 'one' ? 'all' : 'none'
          )
        }
        onStop={audioPlayer.stop}
      />

      {/* Modals */}
      <LocationSelectorModal
        open={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
      <GlobalSearchModal />

      {/* Non-intrusive Toast Messages */}
      <div className="fixed top-16 right-4 z-50 space-y-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold text-white shadow-lg ${
              toast.tone === 'error'
                ? 'bg-[#D92735]'
                : toast.tone === 'success'
                  ? 'bg-emerald-600'
                  : 'bg-[#10182B]'
            }`}
          >
            {toast.text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <NoorLifeShell />
    </AppProvider>
  );
}
