import React, { useEffect, useState } from 'react';
import {
  Bookmark,
  Database,
  FileText,
  Globe,
  HelpCircle,
  Info,
  MapPin,
  Moon,
  Plus,
  Share2,
  Shield,
  Star,
  Sun,
  Trash2,
  User,
  Monitor,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { CALCULATION_METHODS } from '../utils/prayerEngine';
import { offlineDB } from '../utils/offlineStorage';
import { toBengaliDigits } from '../utils/bengaliDigits';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface Props {
  onOpenLocationModal: () => void;
}

export const ProfileSettingsModule: React.FC<Props> = ({ onOpenLocationModal }) => {
  const {
    settings,
    updateSettings,
    bookmarks,
    toggleBookmark,
    notes,
    saveNote,
    deleteNote,
    recentItems,
    setActiveTab,
    setOpenQuranAtSurah,
    showToast,
    t,
  } = useAppStore();

  const [cachedSurahCount, setCachedSurahCount] = useState(0);
  const [cachedAudioCount, setCachedAudioCount] = useState(0);
  const [activeInfoModal, setActiveInfoModal] = useState<'privacy' | 'about' | 'support' | null>(null);

  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteBody, setNewNoteBody] = useState('');

  const refreshCacheStats = async () => {
    const [surahs, audios] = await Promise.all([
      offlineDB.getCachedSurahNumbers(),
      offlineDB.getAudioCount(),
    ]);
    setCachedSurahCount(surahs.length);
    setCachedAudioCount(audios);
  };

  useEffect(() => {
    refreshCacheStats();
  }, []);

  const handleClearCache = async () => {
    await offlineDB.clearAllOfflineCaches();
    await refreshCacheStats();
    showToast(t('অফলাইন ক্যাশ পরিষ্কার করা হয়েছে', 'Offline cache cleared'), 'success');
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim() || !newNoteBody.trim()) return;
    saveNote({
      id: `note_${Date.now()}`,
      title: newNoteTitle.trim(),
      content: newNoteBody.trim(),
    });
    setNewNoteTitle('');
    setNewNoteBody('');
  };

  const handleShareApp = async () => {
    const shareData = {
      title: 'নূর লাইফ — NOOR LIFE',
      text: 'নূর লাইফ — বাংলা ভাষায় সম্পূর্ণ ইসলামিক জীবনসঙ্গী: পবিত্র কুরআন, নামাজের সময়, কিবলা কম্পাস, তাসবিহ ও দোয়া।',
      url: window.location.origin,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch {
        // fallback
      }
    }
    await navigator.clipboard.writeText(`${shareData.title}\n${shareData.text}\n${shareData.url}`);
    showToast(t('অ্যাপের লিংক কপি করা হয়েছে', 'App link copied'), 'success');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10182B] dark:text-white">
            {t('প্রোফাইল ও সেটিংস', 'Profile & Settings')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('ভাষা, থিম, নামাজের হিসাব, অফলাইন ক্যাশ, নোট এবং গোপনীয়তা নীতি', 'Language, theme, prayer preferences, offline cache, notes & privacy')}
          </p>
        </div>
        <PWAInstallButton variant="compact" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: User Profile & Core App Settings */}
        <div className="lg:col-span-7 space-y-5">
          {/* Profile Card */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2457D6]/10 text-[#2457D6] flex items-center justify-center shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  {t('ব্যবহারকারীর নাম', 'Display Name')}
                </label>
                <input
                  type="text"
                  value={settings.userName}
                  onChange={(e) => updateSettings({ userName: e.target.value })}
                  className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-sm font-semibold text-[#10182B] dark:text-white"
                />
              </div>
            </div>

            {/* Language & Theme */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  <Globe className="w-3.5 h-3.5" />
                  {t('অ্যাপের ভাষা (ডিফল্ট বাংলা)', 'App Language')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => updateSettings({ language: 'bn' })}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      settings.language === 'bn'
                        ? 'bg-[#2457D6] text-white border-[#2457D6]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    বাংলা (ডিফল্ট)
                  </button>
                  <button
                    onClick={() => updateSettings({ language: 'en' })}
                    className={`py-2 rounded-xl text-xs font-semibold border ${
                      settings.language === 'en'
                        ? 'bg-[#2457D6] text-white border-[#2457D6]'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
                  {t('থিম মোড', 'Appearance Theme')}
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {([
                    { id: 'light', bn: 'লাইট', icon: Sun },
                    { id: 'dark', bn: 'ডার্ক', icon: Moon },
                    { id: 'system', bn: 'সিস্টেম', icon: Monitor },
                  ] as const).map((th) => {
                    const Icon = th.icon;
                    return (
                      <button
                        key={th.id}
                        onClick={() => updateSettings({ theme: th.id })}
                        className={`py-2 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1 ${
                          settings.theme === th.id
                            ? 'bg-[#2457D6] text-white border-[#2457D6]'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{th.bn}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* Prayer & Location Settings */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
            <h2 className="text-base font-bold text-[#10182B] dark:text-white">
              {t('অবস্থান ও নামাজ গণনা সেটিংস', 'Location & Prayer Calculation')}
            </h2>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-3.5">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[#D92735]" />
                <div>
                  <p className="text-sm font-bold text-[#10182B] dark:text-white">{settings.location.nameBn}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{settings.location.countryBn}</p>
                </div>
              </div>
              <button
                onClick={onOpenLocationModal}
                className="rounded-xl bg-[#2457D6] px-3.5 py-2 text-xs font-semibold text-white"
              >
                পরিবর্তন
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">গণনা পদ্ধতি</label>
                <select
                  value={settings.calculationMethod}
                  onChange={(e) =>
                    updateSettings({
                      calculationMethod: e.target.value as typeof settings.calculationMethod,
                    })
                  }
                  className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-xs"
                >
                  {CALCULATION_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.bn}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">মাজহাব (আসর)</label>
                <select
                  value={settings.madhab}
                  onChange={(e) => updateSettings({ madhab: e.target.value as 'hanafi' | 'shafi' })}
                  className="w-full mt-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-xs"
                >
                  <option value="hanafi">হানাফি (বাংলাদেশ)</option>
                  <option value="shafi">শাফেয়ী / মালিকি / হাম্বলি</option>
                </select>
              </div>
            </div>
          </section>

          {/* Offline Cache & Downloads */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-[#2457D6]" />
                <h2 className="text-base font-bold text-[#10182B] dark:text-white">
                  অফলাইন ক্যাশ ও ডাউনলোড ব্যবস্থাপনা
                </h2>
              </div>
              <button
                onClick={handleClearCache}
                className="inline-flex items-center gap-1 rounded-xl border border-[#D92735]/30 px-3 py-1.5 text-xs font-semibold text-[#D92735] hover:bg-[#D92735]/10"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ক্যাশ মুছুন
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs tabular-nums">
              <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-3">
                <p className="text-slate-500">সংরক্ষিত সূরা টেক্সট</p>
                <p className="text-lg font-bold text-[#10182B] dark:text-white mt-0.5">
                  {toBengaliDigits(cachedSurahCount)}টি সূরা
                </p>
              </div>
              <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-3">
                <p className="text-slate-500">সংরক্ষিত আয়াত অডিও</p>
                <p className="text-lg font-bold text-[#10182B] dark:text-white mt-0.5">
                  {toBengaliDigits(cachedAudioCount)}টি ক্লিপ
                </p>
              </div>
            </div>
          </section>

          {/* Personal Notes */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#2457D6]" />
              <h2 className="text-base font-bold text-[#10182B] dark:text-white">ব্যক্তিগত নোটসমূহ</h2>
            </div>

            <form onSubmit={handleAddNote} className="space-y-2.5">
              <input
                type="text"
                value={newNoteTitle}
                onChange={(e) => setNewNoteTitle(e.target.value)}
                placeholder="নোটের শিরোনাম..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-xs"
              />
              <textarea
                rows={2}
                value={newNoteBody}
                onChange={(e) => setNewNoteBody(e.target.value)}
                placeholder="আপনার ইসলামিক নোট বা শিক্ষা লিখুন..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-xs"
              />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white"
              >
                <Plus className="w-3.5 h-3.5" /> নোট সংরক্ষণ করুন
              </button>
            </form>

            {notes.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-60 overflow-y-auto">
                {notes.map((n) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-[#10182B] dark:text-white">{n.title}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.content}</p>
                    </div>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="p-1.5 text-[#D92735]"
                      aria-label="নোট মুছুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column: Bookmarks, Recent, Privacy & Support */}
        <div className="lg:col-span-5 space-y-5">
          {/* Bookmarks & Favorites */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4 text-[#D92735]" />
                <h2 className="text-base font-bold text-[#10182B] dark:text-white">
                  প্রিয় ও বুকমার্ক ({toBengaliDigits(bookmarks.length)})
                </h2>
              </div>
            </div>
            {bookmarks.length === 0 ? (
              <p className="text-xs text-slate-500">কোনো আয়াত, দোয়া বা আল্লাহর নাম এখনো সংরক্ষণ করা হয়নি।</p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto">
                {bookmarks.map((bm) => (
                  <div key={bm.id} className="py-2.5 flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        if (bm.type === 'ayah') {
                          setOpenQuranAtSurah(Number(bm.refData.surah || 1));
                          setActiveTab('quran');
                        }
                      }}
                      className="text-left min-w-0 flex-1"
                    >
                      <p className="text-xs font-bold text-[#2457D6] dark:text-[#60A5FA] truncate">{bm.titleBn}</p>
                      <p className="text-[11px] text-slate-500 truncate">{bm.subtitleBn}</p>
                    </button>
                    <button
                      onClick={() => toggleBookmark(bm)}
                      className="p-1.5 text-[#D92735]"
                      aria-label="সরান"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Recently Viewed */}
          {recentItems.length > 0 && (
            <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-2.5">
              <h2 className="text-sm font-bold text-[#10182B] dark:text-white">সাম্প্রতিক দেখা</h2>
              <div className="space-y-1.5">
                {recentItems.slice(0, 5).map((r) => (
                  <div key={r.id} className="flex items-center justify-between text-xs py-1">
                    <span className="font-medium text-slate-700 dark:text-slate-200">{r.title}</span>
                    <span className="text-slate-400">{r.module}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Legal, Support & Share */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 divide-y divide-slate-100 dark:divide-slate-800">
            <button
              onClick={() => setActiveInfoModal('privacy')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-t-2xl"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Shield className="w-4 h-4 text-[#2457D6]" /> গোপনীয়তা নীতি ও তথ্য নিরাপত্তা
              </span>
            </button>
            <button
              onClick={() => setActiveInfoModal('about')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Info className="w-4 h-4 text-[#2457D6]" /> নূর লাইফ (NOOR LIFE) সম্পর্কে ও তথ্যসূত্র
              </span>
            </button>
            <button
              onClick={() => setActiveInfoModal('support')}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <HelpCircle className="w-4 h-4 text-[#2457D6]" /> সহায়তা ও যোগাযোগ
              </span>
            </button>
            <button
              onClick={handleShareApp}
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Share2 className="w-4 h-4 text-[#D92735]" /> অ্যাপটি শেয়ার করুন
              </span>
            </button>
            <button
              onClick={() =>
                showToast('জাযাকাল্লাহু খাইরান! প্লে স্টোর রিলিজের পর রেটিং লিংক যুক্ত হবে।', 'info')
              }
              className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-b-2xl"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <Star className="w-4 h-4 text-amber-500" /> অ্যাপটি রেটিং দিন
              </span>
            </button>
          </section>
        </div>
      </div>

      {/* Info Modal (Privacy / About / Support) */}
      {activeInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 p-6 space-y-4 max-h-[82vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#10182B] dark:text-white">
              {activeInfoModal === 'privacy'
                ? 'গোপনীয়তা নীতি ও তথ্য নিরাপত্তা'
                : activeInfoModal === 'about'
                  ? 'নূর লাইফ (NOOR LIFE) সম্পর্কে'
                  : 'সহায়তা ও যোগাযোগ'}
            </h3>

            {activeInfoModal === 'privacy' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  <strong>১. অবস্থানের তথ্য (Location):</strong> শুধুমাত্র আপনার এলাকার সঠিক নামাজের সময়, সেহরি-ইফতার ও কিবলার দিক নির্ণয়ের জন্য ব্যবহৃত হয়। আপনার অবস্থান কোনো বাণিজ্যিক সার্ভারে সংরক্ষণ বা বিক্রি করা হয় না।
                </p>
                <p>
                  <strong>২. স্থানীয় সংরক্ষণ (Local Persistence):</strong> আপনার বুকমার্ক, তাসবিহ গণনা, রোজা ট্র্যাকার, নোট এবং ডাউনলোড করা সূরা আপনার নিজস্ব ডিভাইসের IndexedDB ও LocalStorage-এ সুরক্ষিত থাকে।
                </p>
                <p>
                  <strong>৩. বিজ্ঞাপন নীতিমালা:</strong> কুরআন তিলাওয়াত, পাঠ এবং নামাজ শিক্ষার স্ক্রিন সম্পূর্ণ বিজ্ঞাপনমুক্ত রাখা হয়েছে যাতে ইবাদতে কোনো বিঘ্ন না ঘটে।
                </p>
              </div>
            )}

            {activeInfoModal === 'about' && (
              <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <div className="flex items-center gap-3">
                  <img
                    src="/assets/aistudio/file_0000000007a481fa9c9f1918a2ee7c16_192e84d1.png"
                    alt="NOOR LIFE"
                    referrerPolicy="no-referrer"
                    className="w-14 h-16 object-contain bg-white rounded-xl p-1"
                  />
                  <div>
                    <p className="font-bold text-[#10182B] dark:text-white">নূর লাইফ — NOOR LIFE</p>
                    <p className="text-xs">Package ID: com.noorlife.islamicapp</p>
                  </div>
                </div>
                <p>
                  <strong>প্রামাণ্য তথ্যসূত্র:</strong> পবিত্র কুরআন (AlQuran Cloud উসমানি ও মহিউদ্দিন খান বাংলা অনুবাদ), তাফসীর (Quran.com API — আবু বকর যাকারিয়া / ইবনে কাসীর বাংলা), হাদিস (সহীহ বুখারী, সহীহ মুসলিম, তিরমিযী, আবু দাউদ বাংলা সংকলন) এবং জ্যোতির্বৈজ্ঞানিক নামাজ গণনা (Adhan Library)।
                </p>
              </div>
            )}

            {activeInfoModal === 'support' && (
              <div className="space-y-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                <p>
                  যেকোনো ভুল-ত্রুটি সংশোধন, কুরআন বা হাদিসের পাঠগত পরামর্শ কিংবা কারিগরি সহায়তার জন্য আমাদের সাথে যোগাযোগ করুন:
                </p>
                <p className="font-semibold text-[#2457D6] dark:text-[#60A5FA]">
                  ইমেইল: support@noorlife-app.example
                </p>
                <p>
                  ইন্টারনেট সংযোগ বিচ্ছিন্ন থাকলে পূর্বে ডাউনলোড করা সূরা, দোয়া, তাসবিহ, নামাজ শিক্ষা এবং নামাজের সময়সূচি সম্পূর্ণ অফলাইনে ব্যবহার করতে পারবেন।
                </p>
              </div>
            )}

            <button
              onClick={() => setActiveInfoModal(null)}
              className="w-full rounded-xl bg-[#2457D6] py-2.5 text-xs font-semibold text-white"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
