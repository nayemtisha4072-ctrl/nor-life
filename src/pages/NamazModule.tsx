import React, { useEffect, useState } from 'react';
import {
  Bell,
  BellOff,
  Check,
  Copy,
  MapPin,
  Share2,
  Sliders,
  Volume2,
  Droplets,
  BookOpenCheck,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import {
  CALCULATION_METHODS,
  computeMonthlyPrayerTimes,
  computePrayerTimesForDate,
  PRAYER_LABELS,
} from '../utils/prayerEngine';
import { formatTimeBn, toBengaliDigits } from '../utils/bengaliDigits';
import {
  FIVE_KALIMAS,
  GHUSL_GUIDE,
  NAMAZ_RAKATS,
  NAMAZ_SECTIONS,
  WUDU_GUIDE,
} from '../data/namazWuduKalima';
import { playGentleTone } from '../hooks/useAudioPlayer';

interface Props {
  onOpenLocationModal: () => void;
}

export const NamazModule: React.FC<Props> = ({ onOpenLocationModal }) => {
  const { settings, updateSettings, showToast, t } = useAppStore();
  const [subTab, setSubTab] = useState<'times' | 'education' | 'wudu' | 'kalima'>('times');
  const [showMonthly, setShowMonthly] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todaySchedule = computePrayerTimesForDate(
    settings.location.latitude,
    settings.location.longitude,
    now,
    settings.calculationMethod,
    settings.madhab
  );

  const monthlySchedule = showMonthly
    ? computeMonthlyPrayerTimes(
        settings.location.latitude,
        settings.location.longitude,
        now,
        30,
        settings.calculationMethod,
        settings.madhab
      )
    : [];

  const prayerKeys: Array<'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha'> = [
    'fajr',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ];

  const requestBrowserNotifications = async () => {
    if (typeof Notification === 'undefined') {
      showToast(t('এই ব্রাউজারে নোটিফিকেশন সমর্থিত নয়', 'Notifications unsupported'), 'error');
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      showToast(t('নামাজের নোটিফিকেশন অনুমতি দেওয়া হয়েছে', 'Notification permission granted'), 'success');
      new Notification('নূর লাইফ — নামাজ নোটিফিকেশন সক্রিয়', {
        body: 'প্রতিটি ওয়াক্তের সময় আপনাকে জানানো হবে।',
      });
    } else {
      showToast(t('নোটিফিকেশন অনুমতি পাওয়া যায়নি', 'Permission denied'), 'error');
    }
  };

  const togglePrayerNotif = (key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha') => {
    const curr = settings.notifications[key];
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: { ...curr, enabled: !curr.enabled },
      },
    });
  };

  const updatePrayerSound = (
    key: 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha',
    sound: 'adhan' | 'chime' | 'silent'
  ) => {
    const curr = settings.notifications[key];
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: { ...curr, sound },
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header & Sub-Navigation */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10182B] dark:text-white">
            {t('নামাজ, পবিত্রতা ও কালেমা', 'Salah, Wudu & Kalimas')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('সঠিক সময়সূচি, আজান সতর্কতা, ধাপে ধাপে নামাজ শিক্ষা, অজু-গোসল ও পাঁচ কালেমা', 'Accurate prayer schedule, alerts, Salah guide, Wudu & 5 Kalimas')}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#19243A] border border-slate-200 dark:border-slate-700/60 overflow-x-auto">
          {([
            { id: 'times', bn: 'সময়সূচি', icon: Clock },
            { id: 'education', bn: 'নামাজ শিক্ষা', icon: BookOpenCheck },
            { id: 'wudu', bn: 'অজু ও গোসল', icon: Droplets },
            { id: 'kalima', bn: '৫ কালেমা', icon: Sparkles },
          ] as const).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setSubTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                  subTab === item.id
                    ? 'bg-[#2457D6] text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-[#10182B] dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.bn}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: PRAYER TIMES & NOTIFICATIONS */}
      {subTab === 'times' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Today's Full Timetable & Per-Prayer Alert Controls */}
            <div className="lg:col-span-2 rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#10182B] dark:text-white">
                    {t('আজকের নামাজের সময়সূচি', "Today's Prayer Times")}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {settings.location.nameBn} · {settings.madhab === 'hanafi' ? 'হানাফি আসর' : 'শাফেয়ী/হাম্বলি আসর'}
                  </p>
                </div>
                <button
                  onClick={onOpenLocationModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA] px-3 py-2 text-xs font-semibold hover:bg-[#2457D6]/20 min-h-[40px]"
                >
                  <MapPin className="w-4 h-4" />
                  {t('শহর পরিবর্তন', 'Change City')}
                </button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {/* Sunrise info row */}
                <div className="py-3 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-600 dark:text-slate-300">সূর্যোদয় (Sunrise)</span>
                  <span className="font-bold tabular-nums text-[#10182B] dark:text-white">
                    {formatTimeBn(todaySchedule.sunrise, settings.location.timezone, settings.language)}
                  </span>
                </div>

                {prayerKeys.map((key) => {
                  const isNext = todaySchedule.nextPrayer === key;
                  const notif = settings.notifications[key];
                  return (
                    <div
                      key={key}
                      className={`py-3.5 px-3 -mx-3 rounded-xl flex flex-wrap items-center justify-between gap-3 ${
                        isNext ? 'bg-[#2457D6]/8 dark:bg-[#2457D6]/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-8 rounded-full ${
                            isNext ? 'bg-[#D92735]' : 'bg-slate-200 dark:bg-slate-700'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-bold text-[#10182B] dark:text-white">
                            {PRAYER_LABELS[key].bn}
                            {isNext && (
                              <span className="ml-2 text-[11px] font-semibold text-[#D92735]">
                                · পরবর্তী ওয়াক্ত
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {PRAYER_LABELS[key].en}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-base font-bold tabular-nums text-[#10182B] dark:text-white mr-1">
                          {formatTimeBn(todaySchedule[key], settings.location.timezone, settings.language)}
                        </span>

                        <select
                          value={notif.sound}
                          onChange={(e) =>
                            updatePrayerSound(key, e.target.value as 'adhan' | 'chime' | 'silent')
                          }
                          aria-label={`${PRAYER_LABELS[key].bn} সাউন্ড`}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-2 py-1.5 text-xs text-[#10182B] dark:text-slate-200"
                        >
                          <option value="adhan">আজান টোন</option>
                          <option value="chime">মৃদু ঘণ্টা</option>
                          <option value="silent">নীরব</option>
                        </select>

                        <button
                          onClick={() => togglePrayerNotif(key)}
                          aria-label={`${PRAYER_LABELS[key].bn} নোটিফিকেশন`}
                          className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors ${
                            notif.enabled
                              ? 'bg-[#2457D6] text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}
                        >
                          {notif.enabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="py-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>তাহাজ্জুদ (রাতের শেষ তৃতীয়াংশ শুরু)</span>
                  <span className="font-semibold tabular-nums">
                    {formatTimeBn(todaySchedule.lastThirdOfTheNight, settings.location.timezone, settings.language)}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculation & Notification Settings Card */}
            <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-[#2457D6]" />
                <h3 className="text-base font-bold text-[#10182B] dark:text-white">
                  হিসাব পদ্ধতি ও সতর্কতা
                </h3>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  গণনা পদ্ধতি (Calculation Method)
                </label>
                <select
                  value={settings.calculationMethod}
                  onChange={(e) =>
                    updateSettings({
                      calculationMethod: e.target.value as typeof settings.calculationMethod,
                    })
                  }
                  className="w-full mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2.5 text-xs text-[#10182B] dark:text-white"
                >
                  {CALCULATION_METHODS.map((m) => (
                    <option key={m.key} value={m.key}>
                      {m.bn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  আসরের মাজহাব (Asr Juristic)
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <button
                    onClick={() => updateSettings({ madhab: 'hanafi' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      settings.madhab === 'hanafi'
                        ? 'bg-[#2457D6] text-white border-[#2457D6]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    হানাফি (বাংলাদেশ)
                  </button>
                  <button
                    onClick={() => updateSettings({ madhab: 'shafi' })}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-colors ${
                      settings.madhab === 'shafi'
                        ? 'bg-[#2457D6] text-white border-[#2457D6]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    শাফেয়ী / জমহুর
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[#10182B] dark:text-white">নোটিফিকেশন অনুমতি</span>
                  <span className="text-slate-500 dark:text-slate-400">
                    {notifPermission === 'granted'
                      ? 'অনুমোদিত'
                      : notifPermission === 'denied'
                        ? 'বন্ধ করা'
                        : 'অপেক্ষমাণ'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={requestBrowserNotifications}
                    className="rounded-xl bg-[#2457D6] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1E47B8]"
                  >
                    অনুমতি দিন
                  </button>
                  <button
                    onClick={() => {
                      playGentleTone('adhan-chime');
                      showToast('সতর্কতা ধ্বনি বাজানো হয়েছে', 'info');
                    }}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-[#10182B] dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    সাউন্ড পরীক্ষা
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  সতর্কতা: ব্রাউজার বা Android ব্যাটারি অপটিমাইজেশন ও এক্স্যাক্ট অ্যালার্ম সীমাবদ্ধতার কারণে ব্যাকগ্রাউন্ড নোটিফিকেশন কখনো কয়েক মিনিট বিলম্বিত হতে পারে।
                </p>
              </div>
            </div>
          </div>

          {/* Monthly Calendar Toggle */}
          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-[#10182B] dark:text-white">
                  ৩০ দিনের মাসিক নামাজের ক্যালেন্ডার
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {settings.location.nameBn} শহরের আগামী ৩০ দিনের সম্পূর্ণ ওয়াক্ত তালিকা
                </p>
              </div>
              <button
                onClick={() => setShowMonthly((v) => !v)}
                className="rounded-xl bg-[#D92735] px-4 py-2 text-xs font-semibold text-white hover:bg-[#B81F2B] min-h-[40px]"
              >
                {showMonthly ? 'লুকান' : 'মাসিক সূচি দেখুন'}
              </button>
            </div>

            {showMonthly && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs sm:text-sm text-left tabular-nums">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <th className="py-2.5 pr-3">তারিখ</th>
                      <th className="py-2.5 px-2">ফজর</th>
                      <th className="py-2.5 px-2">সূর্যোদয়</th>
                      <th className="py-2.5 px-2">যোহর</th>
                      <th className="py-2.5 px-2">আসর</th>
                      <th className="py-2.5 px-2">মাগরিব</th>
                      <th className="py-2.5 pl-2">এশা</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {monthlySchedule.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 pr-3 font-semibold whitespace-nowrap">
                          {toBengaliDigits(
                            row.date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' })
                          )}
                        </td>
                        <td className="py-2.5 px-2">{formatTimeBn(row.fajr, settings.location.timezone, settings.language)}</td>
                        <td className="py-2.5 px-2">{formatTimeBn(row.sunrise, settings.location.timezone, settings.language)}</td>
                        <td className="py-2.5 px-2">{formatTimeBn(row.dhuhr, settings.location.timezone, settings.language)}</td>
                        <td className="py-2.5 px-2">{formatTimeBn(row.asr, settings.location.timezone, settings.language)}</td>
                        <td className="py-2.5 px-2">{formatTimeBn(row.maghrib, settings.location.timezone, settings.language)}</td>
                        <td className="py-2.5 pl-2">{formatTimeBn(row.isha, settings.location.timezone, settings.language)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: NAMAZ EDUCATION */}
      {subTab === 'education' && (
        <div className="space-y-5">
          {/* Rakat Chart */}
          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5">
            <h2 className="text-base font-bold text-[#10182B] dark:text-white mb-3">
              পাঁচ ওয়াক্ত ও জুমার নামাজের রাকাত সংখ্যা
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left tabular-nums">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 pr-3">ওয়াক্ত</th>
                    <th className="py-2.5 px-2">পূর্বের সুন্নত</th>
                    <th className="py-2.5 px-2 text-[#D92735]">ফরজ</th>
                    <th className="py-2.5 px-2">পরের সুন্নত</th>
                    <th className="py-2.5 px-2">নফল / বিতর</th>
                    <th className="py-2.5 pl-2">মোট</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {NAMAZ_RAKATS.map((r) => (
                    <tr key={r.nameBn}>
                      <td className="py-3 pr-3 font-bold text-[#10182B] dark:text-white">{r.nameBn}</td>
                      <td className="py-3 px-2">{r.sunnatBefore}</td>
                      <td className="py-3 px-2 font-bold text-[#D92735]">{r.fard}</td>
                      <td className="py-3 px-2">{r.sunnatAfter}</td>
                      <td className="py-3 px-2">{r.witr !== '-' ? r.witr : r.nafl}</td>
                      <td className="py-3 pl-2 font-semibold text-[#2457D6] dark:text-[#60A5FA]">{r.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step-by-step Educational Modules */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {NAMAZ_SECTIONS.map((sec, idx) => (
              <article
                key={sec.id}
                className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-bold text-[#10182B] dark:text-white">
                    {toBengaliDigits(idx + 1)}. {sec.titleBn}
                  </h3>
                </div>
                <p className="text-xs font-medium text-[#2457D6] dark:text-[#60A5FA]">{sec.summaryBn}</p>

                {sec.arabic && (
                  <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-4 space-y-2 border border-slate-200/60 dark:border-slate-700/50">
                    <p className="font-arabic text-xl text-right text-[#10182B] dark:text-white">
                      {sec.arabic}
                    </p>
                    {sec.pronunciationBn && (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <strong>উচ্চারণ:</strong> {sec.pronunciationBn}
                      </p>
                    )}
                    {sec.meaningBn && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        <strong>অর্থ:</strong> {sec.meaningBn}
                      </p>
                    )}
                  </div>
                )}

                <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {sec.detailsBn.map((line, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-[#2457D6] shrink-0 mt-1" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: WUDU & GHUSL */}
      {subTab === 'wudu' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Wudu Card */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#2457D6]/10 text-[#2457D6] flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#10182B] dark:text-white">অজুর সম্পূর্ণ নিয়মাবলি</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">অজুর ফরজ, সুন্নত ধাপ ও অজু ভঙ্গের কারণ</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#2457D6]/8 dark:bg-[#2457D6]/15 p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#2457D6] dark:text-[#60A5FA]">অজুর ৪টি ফরজ</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-[#10182B] dark:text-slate-200">
                {WUDU_GUIDE.fard.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#10182B] dark:text-white mb-2.5">অজুর ধাপে ধাপে নিয়ম</h3>
              <div className="space-y-2">
                {WUDU_GUIDE.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F9FF] dark:bg-[#10182B]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#2457D6] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {toBengaliDigits(i + 1)}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl bg-[#D92735]/8 dark:bg-[#D92735]/15 p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#D92735] dark:text-[#F87171]">অজু ভঙ্গের কারণসমূহ</h3>
              <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-200 list-disc list-inside">
                {WUDU_GUIDE.breakers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          </section>

          {/* Ghusl Card */}
          <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#D92735]/10 text-[#D92735] flex items-center justify-center shrink-0">
                <Droplets className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#10182B] dark:text-white">ফরজ গোসলের নিয়মাবলি</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">গোসলের ৩টি ফরজ ও সুন্নত পদ্ধতি</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#2457D6]/8 dark:bg-[#2457D6]/15 p-4 space-y-2">
              <h3 className="text-sm font-bold text-[#2457D6] dark:text-[#60A5FA]">গোসলের ৩টি ফরজ</h3>
              <ol className="list-decimal list-inside space-y-1.5 text-sm text-[#10182B] dark:text-slate-200">
                {GHUSL_GUIDE.fard.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#10182B] dark:text-white mb-2.5">সুন্নত অনুযায়ী গোসলের ধাপ</h3>
              <div className="space-y-2">
                {GHUSL_GUIDE.steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#F7F9FF] dark:bg-[#10182B]"
                  >
                    <span className="w-6 h-6 rounded-full bg-[#D92735] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {toBengaliDigits(i + 1)}
                    </span>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>প্রয়োজনীয় নির্দেশনা:</strong> ফরজ গোসল করার সময় শরীরের কোনো অংশে রঙ, আঠা বা নেইলপলিশের মতো পানি নিরোধক আবরণ থাকলে তা অপসারণ করে পানি পৌঁছানো আবশ্যক। গোসলের পর আলাদা করে অজু না করলেও নামাজ আদায় করা যায়, যদি না অজু ভঙ্গের কোনো কারণ ঘটে।
            </div>
          </section>
        </div>
      )}

      {/* TAB 4: FIVE KALIMAS */}
      {subTab === 'kalima' && (
        <div className="space-y-4">
          {FIVE_KALIMAS.map((k) => (
            <article
              key={k.id}
              className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base sm:text-lg font-bold text-[#2457D6] dark:text-[#60A5FA]">
                  {toBengaliDigits(k.id)}. {k.titleBn}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${k.titleBn}\n${k.arabic}\nউচ্চারণ: ${k.pronunciationBn}\nঅর্থ: ${k.meaningBn}`
                      );
                      showToast('কালেমা কপি করা হয়েছে', 'success');
                    }}
                    aria-label="কপি করুন"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={async () => {
                      const text = `${k.titleBn}\n${k.arabic}\n${k.pronunciationBn}\nঅর্থ: ${k.meaningBn}\n— নূর লাইফ`;
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: k.titleBn, text });
                          return;
                        } catch {
                          // fallback
                        }
                      }
                      await navigator.clipboard.writeText(text);
                      showToast('শেয়ারের জন্য কপি করা হয়েছে', 'success');
                    }}
                    aria-label="শেয়ার করুন"
                    className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="font-arabic text-2xl sm:text-3xl text-right text-[#10182B] dark:text-white leading-loose py-2">
                {k.arabic}
              </p>

              <div className="space-y-1.5 text-sm leading-relaxed">
                <p className="text-slate-700 dark:text-slate-200">
                  <strong className="text-[#D92735] dark:text-[#F87171]">বাংলা উচ্চারণ:</strong> {k.pronunciationBn}
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <strong>অর্থ:</strong> {k.meaningBn}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
