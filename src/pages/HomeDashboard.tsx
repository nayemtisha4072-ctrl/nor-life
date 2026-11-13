import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  Compass,
  Heart,
  MapPin,
  Moon,
  Sparkles,
  Calendar,
  Calculator,
  Share2,
  Bookmark,
  CheckCircle2,
  Circle,
  Sunrise,
  Sunset,
  ScrollText,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import {
  computePrayerTimesForDate,
  PRAYER_LABELS,
} from '../utils/prayerEngine';
import {
  formatBengaliCalendarDate,
  formatCountdown,
  formatGregorianDateBn,
  formatTimeBn,
  getHijriDateParts,
  toBengaliDigits,
} from '../utils/bengaliDigits';
import {
  DAILY_AYAHS,
  DAILY_HADITHS,
  DAILY_REMINDERS_BN,
} from '../data/islamicKnowledge';
import { storage } from '../utils/offlineStorage';
import { PWAInstallButton } from '../components/PWAInstallButton';

interface Props {
  onOpenLocationModal: () => void;
}

export const HomeDashboard: React.FC<Props> = ({ onOpenLocationModal }) => {
  const {
    settings,
    setActiveTab,
    setActiveToolId,
    setOpenQuranAtSurah,
    toggleBookmark,
    isBookmarked,
    showToast,
    t,
  } = useAppStore();

  const [now, setNow] = useState(() => new Date());
  const [prayerTracker, setPrayerTracker] = useState<Record<string, Record<string, boolean>>>(() =>
    storage.getDailyPrayerTracker()
  );

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const schedule = computePrayerTimesForDate(
    settings.location.latitude,
    settings.location.longitude,
    now,
    settings.calculationMethod,
    settings.madhab
  );

  const hijri = getHijriDateParts(now, settings.hijriAdjustment);
  const gregorianBn = formatGregorianDateBn(now, settings.language);
  const banglaDate = formatBengaliCalendarDate(now);
  const todayKey = now.toISOString().slice(0, 10);
  const todayCompleted = prayerTracker[todayKey] || {};

  // Deterministic daily index based on day of year
  const dayOfYear = Math.floor(
    (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const dailyAyah = DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
  const dailyHadith = DAILY_HADITHS[dayOfYear % DAILY_HADITHS.length];
  const dailyReminder = DAILY_REMINDERS_BN[dayOfYear % DAILY_REMINDERS_BN.length];

  const lastRead = storage.getLastRead();

  const togglePrayerDone = (key: string) => {
    const updated = {
      ...prayerTracker,
      [todayKey]: {
        ...todayCompleted,
        [key]: !todayCompleted[key],
      },
    };
    setPrayerTracker(updated);
    storage.saveDailyPrayerTracker(updated);
  };

  const fivePrayers: Array<{ key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'; time: Date }> = [
    { key: 'fajr', time: schedule.fajr },
    { key: 'dhuhr', time: schedule.dhuhr },
    { key: 'asr', time: schedule.asr },
    { key: 'maghrib', time: schedule.maghrib },
    { key: 'isha', time: schedule.isha },
  ];

  const quickTools = [
    { id: 'quran', tab: 'quran' as const, labelBn: 'আল-কুরআন', labelEn: 'Al-Quran', icon: BookOpen, tone: 'bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA]' },
    { id: 'qibla', tab: 'tools' as const, labelBn: 'কিবলা কম্পাস', labelEn: 'Qibla', icon: Compass, tone: 'bg-[#D92735]/10 text-[#D92735] dark:text-[#F87171]' },
    { id: 'tasbih', tab: 'tools' as const, labelBn: 'ডিজিটাল তাসবিহ', labelEn: 'Tasbih', icon: Sparkles, tone: 'bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA]' },
    { id: 'duas', tab: 'tools' as const, labelBn: 'দোয়া ও জিকির', labelEn: 'Duas', icon: Heart, tone: 'bg-[#D92735]/10 text-[#D92735] dark:text-[#F87171]' },
    { id: 'names99', tab: 'tools' as const, labelBn: 'আল্লাহর ৯৯ নাম', labelEn: '99 Names', icon: ScrollText, tone: 'bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA]' },
    { id: 'calendar', tab: 'tools' as const, labelBn: 'হিজরি ক্যালেন্ডার', labelEn: 'Calendar', icon: Calendar, tone: 'bg-[#D92735]/10 text-[#D92735] dark:text-[#F87171]' },
    { id: 'ramadan', tab: 'tools' as const, labelBn: 'রমজান ও রোজা', labelEn: 'Ramadan', icon: Moon, tone: 'bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA]' },
    { id: 'zakat', tab: 'tools' as const, labelBn: 'যাকাত হিসাব', labelEn: 'Zakat', icon: Calculator, tone: 'bg-[#D92735]/10 text-[#D92735] dark:text-[#F87171]' },
  ];

  const handleShareText = async (title: string, text: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${text}\n\n— নূর লাইফ (NOOR LIFE)` });
        return;
      } catch {
        // user cancelled or fallback to copy
      }
    }
    try {
      await navigator.clipboard.writeText(`${text}\n— নূর লাইফ`);
      showToast(t('ক্লিপবোর্ডে কপি করা হয়েছে', 'Copied to clipboard'), 'success');
    } catch {
      showToast(t('শেয়ার করা যায়নি', 'Could not share'), 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Grid: Prayer Dashboard + Daily Spiritual Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Hero Prayer Card */}
        <section className="lg:col-span-8 rounded-3xl bg-gradient-to-br from-[#2457D6] via-[#1C45B4] to-[#10182B] text-white p-5 sm:p-7 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-blue-100">
                <span>{gregorianBn}</span>
                <span aria-hidden="true">·</span>
                <span>{banglaDate}</span>
              </div>
              <p className="text-sm sm:text-base font-semibold text-white">
                {settings.language === 'bn' ? hijri.formattedBn : hijri.formattedEn}
              </p>
            </div>

            <button
              onClick={onOpenLocationModal}
              className="inline-flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors min-h-[40px]"
            >
              <MapPin className="w-4 h-4 text-[#FCA5A5]" />
              <span>
                {settings.language === 'bn' ? settings.location.nameBn : settings.location.nameEn}
              </span>
            </button>
          </div>

          <div className="relative z-10 my-6 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <p className="text-xs sm:text-sm text-blue-200">
                {t('বর্তমান ওয়াক্ত', 'Current Prayer')} ·{' '}
                <span className="font-semibold text-white">
                  {settings.language === 'bn'
                    ? PRAYER_LABELS[schedule.currentPrayer].bn
                    : PRAYER_LABELS[schedule.currentPrayer].en}
                </span>
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 text-balance">
                {t('পরবর্তী ওয়াক্ত:', 'Next:')}{' '}
                {settings.language === 'bn'
                  ? PRAYER_LABELS[schedule.nextPrayer].bn
                  : PRAYER_LABELS[schedule.nextPrayer].en}
              </h1>
              <p className="text-sm text-blue-100 mt-1 tabular-nums">
                {t('ওয়াক্ত শুরু', 'Starts at')}{' '}
                {formatTimeBn(schedule.nextPrayerTime, settings.location.timezone, settings.language)}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs text-blue-200">{t('বাকি সময়', 'Time Remaining')}</p>
              <div className="text-4xl sm:text-5xl font-bold font-display tabular-nums tracking-tight mt-1">
                {formatCountdown(schedule.msRemaining, settings.language)}
              </div>
              <div className="flex sm:justify-end items-center gap-4 text-xs text-blue-100 mt-2 tabular-nums">
                <span className="inline-flex items-center gap-1">
                  <Sunrise className="w-3.5 h-3.5 text-amber-300" />
                  {t('সূর্যোদয়', 'Sunrise')}:{' '}
                  {formatTimeBn(schedule.sunrise, settings.location.timezone, settings.language)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Sunset className="w-3.5 h-3.5 text-rose-300" />
                  {t('সূর্যাস্ত', 'Sunset')}:{' '}
                  {formatTimeBn(schedule.sunset, settings.location.timezone, settings.language)}
                </span>
              </div>
            </div>
          </div>

          {/* 5 Daily Prayers Strip */}
          <div className="relative z-10 grid grid-cols-5 gap-1.5 sm:gap-2.5 pt-4 border-t border-white/15">
            {fivePrayers.map(({ key, time }) => {
              const isNext = schedule.nextPrayer === key;
              const isDone = Boolean(todayCompleted[key]);
              return (
                <div
                  key={key}
                  className={`rounded-2xl p-2 sm:p-3 text-center transition-colors ${
                    isNext
                      ? 'bg-[#D92735] text-white shadow-md'
                      : 'bg-white/10 hover:bg-white/15 text-white'
                  }`}
                >
                  <p className="text-[11px] sm:text-xs font-semibold truncate">
                    {settings.language === 'bn' ? PRAYER_LABELS[key].bn : PRAYER_LABELS[key].en}
                  </p>
                  <p className="text-[11px] sm:text-sm font-bold tabular-nums mt-1">
                    {formatTimeBn(time, settings.location.timezone, settings.language)}
                  </p>
                  <button
                    onClick={() => togglePrayerDone(key)}
                    title={t('নামাজ আদায় চিহ্নিত করুন', 'Mark prayer completed')}
                    className="mt-1.5 inline-flex items-center justify-center w-7 h-7 rounded-full hover:bg-white/15"
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    ) : (
                      <Circle className="w-4 h-4 text-white/60" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right Column: Official NOOR LIFE Brand & Last Read / Install */}
        <aside className="lg:col-span-4 flex flex-col gap-4 justify-between">
          <div className="rounded-3xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex items-center gap-4 shadow-sm">
            <img
              src="/assets/aistudio/file_0000000007a481fa9c9f1918a2ee7c16_192e84d1.png"
              alt="নূর লাইফ লোগো"
              referrerPolicy="no-referrer"
              className="w-16 h-20 object-contain rounded-xl bg-white p-1 shrink-0"
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-[#10182B] dark:text-white">
                {t('নূর লাইফ', 'NOOR LIFE')}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                {t('আপনার সম্পূর্ণ ইসলামিক জীবনসঙ্গী', 'Your Complete Islamic Companion')}
              </p>
              <button
                onClick={() => setActiveTab('namaz')}
                className="mt-2 inline-flex items-center text-xs font-semibold text-[#D92735] hover:underline"
              >
                {t('মাসিক নামাজের সময়সূচি দেখুন →', 'View Monthly Prayer Schedule →')}
              </button>
            </div>
          </div>

          {lastRead ? (
            <button
              onClick={() => {
                setOpenQuranAtSurah(lastRead.surahNumber);
                setActiveTab('quran');
              }}
              className="w-full text-left rounded-3xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 hover:border-[#2457D6] transition-colors shadow-sm"
            >
              <p className="text-xs font-medium text-[#2457D6] dark:text-[#60A5FA]">
                {t('সর্বশেষ পঠিত সূরা', 'Continue Reading Quran')}
              </p>
              <p className="text-base font-bold text-[#10182B] dark:text-white mt-1">
                {lastRead.surahName}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t(`আয়াত ${toBengaliDigits(lastRead.ayahNumber)} থেকে পুনরায় পড়ুন`, `Resume from Ayah ${lastRead.ayahNumber}`)}
              </p>
            </button>
          ) : (
            <button
              onClick={() => {
                setOpenQuranAtSurah(1);
                setActiveTab('quran');
              }}
              className="w-full text-left rounded-3xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 hover:border-[#2457D6] transition-colors shadow-sm"
            >
              <p className="text-xs font-medium text-[#2457D6] dark:text-[#60A5FA]">
                {t('পবিত্র কুরআন তিলাওয়াত শুরু করুন', 'Start Reading Holy Quran')}
              </p>
              <p className="text-base font-bold text-[#10182B] dark:text-white mt-1">
                সূরা আল-ফাতিহা (১)
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t('আরবি, বাংলা উচ্চারণ, অনুবাদ ও অডিওসহ', 'Arabic, Bengali translation & audio')}
              </p>
            </button>
          )}

          <PWAInstallButton variant="card" />
        </aside>
      </div>

      {/* Quick Access Feature Cards */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base sm:text-lg font-bold text-[#10182B] dark:text-white">
            {t('দ্রুত প্রবেশ', 'Quick Access')}
          </h2>
          <button
            onClick={() => setActiveTab('tools')}
            className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA] hover:underline"
          >
            {t('সকল টুলস দেখুন', 'See All Tools')}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickTools.map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                onClick={() => {
                  if (tool.tab === 'quran') {
                    setActiveTab('quran');
                  } else {
                    setActiveToolId(tool.id);
                    setActiveTab('tools');
                  }
                }}
                className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-3.5 flex flex-col items-center justify-center gap-2.5 text-center hover:border-[#2457D6] transition-colors min-h-[96px]"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tool.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#10182B] dark:text-slate-100 leading-tight">
                  {settings.language === 'bn' ? tool.labelBn : tool.labelEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Quran Ayah, Daily Hadith, Daily Islamic Reminder */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Daily Ayah */}
        <article className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA]">
                {t('আজকের আয়াত', 'Daily Quran Verse')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {dailyAyah.surahNameBn} · {toBengaliDigits(dailyAyah.surahNumber)}:{toBengaliDigits(dailyAyah.ayahNumber)}
              </span>
            </div>
            <p className="font-arabic text-xl sm:text-2xl text-right text-[#10182B] dark:text-white leading-loose mb-3">
              {dailyAyah.arabic}
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              “{dailyAyah.bengali}”
            </p>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() =>
                toggleBookmark({
                  id: `ayah_${dailyAyah.surahNumber}_${dailyAyah.ayahNumber}`,
                  type: 'ayah',
                  titleBn: `${dailyAyah.surahNameBn} (${toBengaliDigits(dailyAyah.ayahNumber)})`,
                  subtitleBn: dailyAyah.bengali,
                  arabic: dailyAyah.arabic,
                  refData: { surah: dailyAyah.surahNumber, ayah: dailyAyah.ayahNumber },
                })
              }
              aria-label={t('বুকমার্ক', 'Bookmark')}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Bookmark
                className={`w-4 h-4 ${
                  isBookmarked(`ayah_${dailyAyah.surahNumber}_${dailyAyah.ayahNumber}`)
                    ? 'fill-[#D92735] text-[#D92735]'
                    : ''
                }`}
              />
            </button>
            <button
              onClick={() =>
                handleShareText(
                  dailyAyah.surahNameBn,
                  `${dailyAyah.arabic}\n${dailyAyah.bengali} (${dailyAyah.surahNameBn}: ${toBengaliDigits(dailyAyah.ayahNumber)})`
                )
              }
              aria-label={t('শেয়ার', 'Share')}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </article>

        {/* Daily Hadith */}
        <article className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-[#D92735] dark:text-[#F87171]">
                {t('আজকের হাদিস', 'Daily Hadith')}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{dailyHadith.reference}</span>
            </div>
            <p className="text-sm sm:text-base text-[#10182B] dark:text-slate-100 leading-relaxed font-medium">
              “{dailyHadith.bengali}”
            </p>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveToolId('knowledge');
                setActiveTab('tools');
              }}
              className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA] hover:underline"
            >
              {t('আরও হাদিস পড়ুন →', 'Read More Hadith →')}
            </button>
            <button
              onClick={() => handleShareText('আজকের হাদিস', `${dailyHadith.bengali}\n— ${dailyHadith.reference}`)}
              aria-label={t('শেয়ার', 'Share')}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </article>

        {/* Daily Islamic Reminder */}
        <article className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA] mb-3">
              {t('দৈনিক ইসলামিক রিমাইন্ডার', 'Daily Islamic Reminder')}
            </p>
            <p className="text-sm sm:text-base text-[#10182B] dark:text-slate-100 leading-relaxed">
              {dailyReminder}
            </p>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => {
                setActiveToolId('tasbih');
                setActiveTab('tools');
              }}
              className="text-xs font-semibold text-[#D92735] hover:underline"
            >
              {t('তাসবিহ জিকির শুরু করুন →', 'Open Digital Tasbih →')}
            </button>
            <button
              onClick={() => handleShareText('দৈনিক ইসলামিক রিমাইন্ডার', dailyReminder)}
              aria-label={t('শেয়ার', 'Share')}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>
        </article>
      </section>
    </div>
  );
};
