import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Calculator,
  Info,
} from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import {
  formatBengaliCalendarDate,
  formatGregorianDateBn,
  formatTimeBn,
  getHijriDateParts,
  toBengaliDigits,
} from '../../utils/bengaliDigits';
import {
  ISLAMIC_IMPORTANT_EVENTS,
  RAMADAN_GUIDE,
  ZAKAT_NISAB,
} from '../../data/ramadanZakatCalendar';
import { computeMonthlyPrayerTimes, computePrayerTimesForDate } from '../../utils/prayerEngine';
import { storage } from '../../utils/offlineStorage';

export const IslamicCalendarTool: React.FC = () => {
  const { settings, updateSettings } = useAppStore();
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();

  const today = new Date();
  const todayHijri = getHijriDateParts(today, settings.hijriAdjustment);

  const monthTitleBn = toBengaliDigits(
    viewDate.toLocaleDateString('bn-BD', { month: 'long', year: 'numeric' })
  );

  const weekdaysBn = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

  const changeMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-8 rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-[#10182B] dark:text-white">{monthTitleBn}</h2>
            <p className="text-xs text-[#2457D6] dark:text-[#60A5FA] mt-0.5">
              আজ: {todayHijri.formattedBn} · {formatBengaliCalendarDate(today)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              aria-label="পূর্ববর্তী মাস"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewDate(new Date())}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA]"
            >
              আজ
            </button>
            <button
              onClick={() => changeMonth(1)}
              aria-label="পরবর্তী মাস"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Moon sighting adjustment */}
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] px-3.5 py-2.5 text-xs">
          <span className="font-medium text-slate-600 dark:text-slate-300">
            চাঁদ দেখা সমন্বয় (Moon-Sighting Offset):
          </span>
          <div className="flex items-center gap-1.5">
            {[-2, -1, 0, 1, 2].map((offset) => (
              <button
                key={offset}
                onClick={() => updateSettings({ hijriAdjustment: offset })}
                className={`px-2.5 py-1 rounded-lg font-semibold tabular-nums ${
                  settings.hijriAdjustment === offset
                    ? 'bg-[#D92735] text-white'
                    : 'bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {offset > 0 ? `+${toBengaliDigits(offset)}` : toBengaliDigits(offset)} দিন
              </button>
            ))}
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {weekdaysBn.map((wd, idx) => (
            <div
              key={wd}
              className={`py-2 text-xs font-bold ${
                idx === 5 ? 'text-[#D92735]' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {wd}
            </div>
          ))}
          {Array.from({ length: firstWeekday }).map((_, i) => (
            <div key={`empty_${i}`} />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((dayNum) => {
            const cellDate = new Date(year, month, dayNum);
            const isToday =
              cellDate.toDateString() === today.toDateString();
            const hParts = getHijriDateParts(cellDate, settings.hijriAdjustment);
            const hasEvent = ISLAMIC_IMPORTANT_EVENTS.some(
              (ev) => ev.hijriMonth === hParts.monthIndex + 1 && ev.hijriDay === hParts.day
            );
            return (
              <div
                key={dayNum}
                className={`rounded-xl p-1.5 sm:p-2 border text-center tabular-nums min-h-[56px] flex flex-col items-center justify-center ${
                  isToday
                    ? 'bg-[#2457D6] text-white border-[#2457D6]'
                    : hasEvent
                      ? 'bg-[#D92735]/8 border-[#D92735]/40 text-[#10182B] dark:text-white'
                      : 'border-slate-100 dark:border-slate-800 text-[#10182B] dark:text-slate-100'
                }`}
              >
                <span className="text-xs sm:text-sm font-bold">{toBengaliDigits(dayNum)}</span>
                <span
                  className={`text-[10px] mt-0.5 truncate max-w-full ${
                    isToday ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {toBengaliDigits(hParts.day)} {hParts.monthBn.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Important Islamic Dates */}
      <div className="lg:col-span-4 rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
        <div className="flex items-center gap-2 text-[#D92735]">
          <CalendarIcon className="w-4 h-4" />
          <h3 className="text-base font-bold text-[#10182B] dark:text-white">গুরুত্বপূর্ণ ইসলামিক দিবস</h3>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {ISLAMIC_IMPORTANT_EVENTS.map((ev, i) => (
            <div key={i} className="py-3 space-y-1">
              <p className="text-sm font-bold text-[#2457D6] dark:text-[#60A5FA]">{ev.titleBn}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ev.descriptionBn}</p>
              <p className="text-[11px] text-slate-400">{ev.noteBn}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const RamadanFastingTool: React.FC = () => {
  const { settings } = useAppStore();
  const [fastingLog, setFastingLog] = useState<Record<string, boolean>>(() =>
    storage.getFastingTracker()
  );

  const now = new Date();
  const todayPt = computePrayerTimesForDate(
    settings.location.latitude,
    settings.location.longitude,
    now,
    settings.calculationMethod,
    settings.madhab
  );

  const thirtyDays = computeMonthlyPrayerTimes(
    settings.location.latitude,
    settings.location.longitude,
    now,
    30,
    settings.calculationMethod,
    settings.madhab
  );

  const toggleFastDay = (dateKey: string) => {
    const next = { ...fastingLog, [dateKey]: !fastingLog[dateKey] };
    setFastingLog(next);
    storage.saveFastingTracker(next);
  };

  const completedCount = Object.values(fastingLog).filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* Today's Sehri & Iftar Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-gradient-to-br from-[#2457D6] to-[#10182B] text-white p-5">
          <p className="text-xs text-blue-200">সেহরির শেষ সময় (ফজর শুরু)</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {formatTimeBn(todayPt.sehriEnd, settings.location.timezone, settings.language)}
          </p>
          <p className="text-xs text-blue-100 mt-1">{settings.location.nameBn} · আজ</p>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-[#D92735] to-[#8E1520] text-white p-5">
          <p className="text-xs text-rose-100">ইফতারের সময় (মাগরিব শুরু)</p>
          <p className="text-3xl font-bold tabular-nums mt-1">
            {formatTimeBn(todayPt.iftar, settings.location.timezone, settings.language)}
          </p>
          <p className="text-xs text-rose-100 mt-1">{formatGregorianDateBn(now, settings.language)}</p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">দৈনিক রোজা ট্র্যাকার</p>
            <p className="text-2xl font-bold text-[#10182B] dark:text-white tabular-nums mt-1">
              {toBengaliDigits(completedCount)} টি রোজা সম্পন্ন
            </p>
          </div>
          <button
            onClick={() => toggleFastDay(now.toISOString().slice(0, 10))}
            className={`mt-3 w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
              fastingLog[now.toISOString().slice(0, 10)]
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2457D6] text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            {fastingLog[now.toISOString().slice(0, 10)] ? 'আজকের রোজা চিহ্নিত হয়েছে' : 'আজকের রোজা সম্পন্ন চিহ্নিত করুন'}
          </button>
        </div>
      </div>

      {/* Duas & Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
          <h3 className="text-base font-bold text-[#2457D6] dark:text-[#60A5FA]">রমজানের দোয়া ও নিয়ত</h3>
          <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-4 space-y-1.5">
            <p className="text-xs font-bold text-[#D92735]">ইফতারের দোয়া ({RAMADAN_GUIDE.iftarDua.reference})</p>
            <p className="font-arabic text-xl text-right text-[#10182B] dark:text-white">
              {RAMADAN_GUIDE.iftarDua.arabic}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <strong>উচ্চারণ:</strong> {RAMADAN_GUIDE.iftarDua.pronunciationBn}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>অর্থ:</strong> {RAMADAN_GUIDE.iftarDua.meaningBn}
            </p>
          </div>

          <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-4 space-y-1.5">
            <p className="text-xs font-bold text-[#2457D6]">লাইলাতুল কদরের দোয়া ({RAMADAN_GUIDE.laylatulQadrDua.reference})</p>
            <p className="font-arabic text-xl text-right text-[#10182B] dark:text-white">
              {RAMADAN_GUIDE.laylatulQadrDua.arabic}
            </p>
            <p className="text-xs text-slate-700 dark:text-slate-300">
              <strong>উচ্চারণ:</strong> {RAMADAN_GUIDE.laylatulQadrDua.pronunciationBn}
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              <strong>অর্থ:</strong> {RAMADAN_GUIDE.laylatulQadrDua.meaningBn}
            </p>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            <strong>ফিতরা ও ঈদ প্রস্তুতি:</strong> {RAMADAN_GUIDE.fitraInfoBn}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
          <h3 className="text-base font-bold text-[#10182B] dark:text-white">রোজার নিয়ম ও রোজা ভঙ্গের কারণ</h3>
          <div>
            <p className="text-xs font-bold text-[#2457D6] mb-2">মূল নিয়মাবলি</p>
            <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
              {RAMADAN_GUIDE.rulesBn.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold text-[#D92735] mb-2">যেসব কারণে রোজা ভঙ্গ হয়</p>
            <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300 list-disc list-inside">
              {RAMADAN_GUIDE.invalidatorsBn.map((inv, i) => (
                <li key={i}>{inv}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* 30-day Sehri & Iftar Schedule */}
      <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-[#2457D6]" />
          <h3 className="text-base font-bold text-[#10182B] dark:text-white">
            আগামী ৩০ দিনের সেহরি ও ইফতারের সময়সূচি ({settings.location.nameBn})
          </h3>
        </div>
        <div className="overflow-x-auto max-h-80 overflow-y-auto">
          <table className="w-full text-xs sm:text-sm text-left tabular-nums">
            <thead className="sticky top-0 bg-white dark:bg-[#19243A] border-b border-slate-200 dark:border-slate-700 text-slate-500">
              <tr>
                <th className="py-2 pr-3">তারিখ</th>
                <th className="py-2 px-2">হিজরি</th>
                <th className="py-2 px-2">সেহরির শেষ</th>
                <th className="py-2 px-2">ইফতার</th>
                <th className="py-2 pl-2">রোজা</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {thirtyDays.map((d) => {
                const key = d.date.toISOString().slice(0, 10);
                const h = getHijriDateParts(d.date, settings.hijriAdjustment);
                return (
                  <tr key={key}>
                    <td className="py-2.5 pr-3 font-medium whitespace-nowrap">
                      {toBengaliDigits(d.date.toLocaleDateString('bn-BD', { day: 'numeric', month: 'short' }))}
                    </td>
                    <td className="py-2.5 px-2 text-xs text-slate-500 whitespace-nowrap">
                      {toBengaliDigits(h.day)} {h.monthBn}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-[#2457D6] dark:text-[#60A5FA]">
                      {formatTimeBn(d.sehriEnd, settings.location.timezone, settings.language)}
                    </td>
                    <td className="py-2.5 px-2 font-semibold text-[#D92735]">
                      {formatTimeBn(d.iftar, settings.location.timezone, settings.language)}
                    </td>
                    <td className="py-2.5 pl-2">
                      <button
                        onClick={() => toggleFastDay(key)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          fastingLog[key]
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {fastingLog[key] ? 'সম্পন্ন' : 'চিহ্নিত'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const ZakatCalculatorTool: React.FC = () => {
  const [cash, setCash] = useState(0);
  const [bank, setBank] = useState(0);
  const [goldGrams, setGoldGrams] = useState(0);
  const [silverGrams, setSilverGrams] = useState(0);
  const [business, setBusiness] = useState(0);
  const [otherAssets, setOtherAssets] = useState(0);
  const [liabilities, setLiabilities] = useState(0);

  const [goldRatePerGram, setGoldRatePerGram] = useState(ZAKAT_NISAB.defaultGoldPricePerGramBDT);
  const [silverRatePerGram, setSilverRatePerGram] = useState(ZAKAT_NISAB.defaultSilverPricePerGramBDT);
  const [nisabBasis, setNisabBasis] = useState<'silver' | 'gold'>('silver');

  const goldValue = goldGrams * goldRatePerGram;
  const silverValue = silverGrams * silverRatePerGram;
  const totalAssets = cash + bank + goldValue + silverValue + business + otherAssets;
  const netZakatable = Math.max(0, totalAssets - liabilities);

  const silverNisabValue = ZAKAT_NISAB.silverGrams * silverRatePerGram;
  const goldNisabValue = ZAKAT_NISAB.goldGrams * goldRatePerGram;
  const activeNisab = nisabBasis === 'silver' ? silverNisabValue : goldNisabValue;

  const isEligible = netZakatable >= activeNisab && netZakatable > 0;
  const zakatPayable = isEligible ? netZakatable * ZAKAT_NISAB.zakatRate : 0;

  const numberField = (label: string, val: number, onChange: (n: number) => void, unit = '৳') => (
    <div>
      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 block mb-1">
        {label} ({unit})
      </label>
      <input
        type="number"
        min={0}
        value={val || ''}
        placeholder="০"
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3.5 py-2.5 text-sm text-[#10182B] dark:text-white tabular-nums"
      />
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-[#2457D6]" />
          <h2 className="text-lg font-bold text-[#10182B] dark:text-white">যাকাত ক্যালকুলেটর</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {numberField('হাতে থাকা নগদ টাকা', cash, setCash)}
          {numberField('ব্যাংক সঞ্চয় ও এফডিআর', bank, setBank)}
          {numberField('স্বর্ণের পরিমাণ (গ্রাম)', goldGrams, setGoldGrams, 'গ্রাম')}
          {numberField('রুপার পরিমাণ (গ্রাম)', silverGrams, setSilverGrams, 'গ্রাম')}
          {numberField('ব্যবসায়িক পণ্য / স্টক', business, setBusiness)}
          {numberField('অন্যান্য যাকাতযোগ্য সম্পদ (শেয়ার/পাওনা)', otherAssets, setOtherAssets)}
          {numberField('তাৎক্ষণিক পরিশোধযোগ্য ঋণ ও দায়', liabilities, setLiabilities)}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <h3 className="text-sm font-bold text-[#10182B] dark:text-white">
            স্বর্ণ ও রুপার বর্তমান বাজারদর (প্রতি গ্রাম, ম্যানুয়ালি পরিবর্তনযোগ্য)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {numberField('প্রতি গ্রাম স্বর্ণের মূল্য', goldRatePerGram, setGoldRatePerGram)}
            {numberField('প্রতি গ্রাম রুপার মূল্য', silverRatePerGram, setSilverRatePerGram)}
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-slate-500">নিসাব ভিত্তি:</span>
            <button
              onClick={() => setNisabBasis('silver')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                nisabBasis === 'silver'
                  ? 'bg-[#2457D6] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              রুপার নিসাব (৬১২.৩৬ গ্রাম) — দরিদ্রবান্ধব
            </button>
            <button
              onClick={() => setNisabBasis('gold')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold ${
                nisabBasis === 'gold'
                  ? 'bg-[#2457D6] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              স্বর্ণের নিসাব (৮৭.৪৮ গ্রাম)
            </button>
          </div>
        </div>
      </div>

      {/* Zakat Breakdown Summary */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-3xl bg-gradient-to-br from-[#2457D6] to-[#10182B] text-white p-6 space-y-4">
          <div>
            <p className="text-xs text-blue-200">মোট প্রদেয় যাকাত (২.৫%)</p>
            <p className="text-4xl font-bold font-display tabular-nums mt-1">
              ৳ {toBengaliDigits(Math.round(zakatPayable).toLocaleString())}
            </p>
            <p className="text-xs text-blue-100 mt-1">
              {isEligible
                ? 'আপনার সম্পদ নিসাব পরিমাণ পূর্ণ করেছে (যাকাত ফরজ)'
                : 'বর্তমান নিট সম্পদ নিসাব পরিমাণের চেয়ে কম'}
            </p>
          </div>

          <div className="pt-4 border-t border-white/15 space-y-2 text-xs sm:text-sm tabular-nums">
            <div className="flex justify-between">
              <span className="text-blue-200">মোট সম্পদ:</span>
              <span className="font-semibold">৳ {toBengaliDigits(Math.round(totalAssets).toLocaleString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">বাদযোগ্য ঋণ ও দায়:</span>
              <span className="font-semibold">- ৳ {toBengaliDigits(Math.round(liabilities).toLocaleString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">নিট যাকাতযোগ্য সম্পদ:</span>
              <span className="font-bold">৳ {toBengaliDigits(Math.round(netZakatable).toLocaleString())}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200">নির্বাচিত নিসাব সীমা:</span>
              <span className="font-semibold">৳ {toBengaliDigits(Math.round(activeNisab).toLocaleString())}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-[#D92735] shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed space-y-1">
            <p className="font-bold text-[#10182B] dark:text-white">শরয়ী পরামর্শ ও সতর্কতা</p>
            <p>
              এক চন্দ্রবছর (হawl) পূর্ণ হওয়া এবং বাজুসের (BAJUS) হালনাগাদ স্বর্ণ-রুপার বাজারদর অনুযায়ী হিসাব করা উত্তম। যৌথ ব্যবসা, কৃষি ফসল, পেনশন বা জটিল আর্থিক অবস্থার যাকাত নির্ণয়ের জন্য যোগ্য মুফতি বা আলেমের পরামর্শ নিন।
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#2457D6]" />
          <span>১ ভরি = ১১.৬৬৪ গ্রাম। ৭.৫ ভরি স্বর্ণ = ৮৭.৪৮ গ্রাম; ৫২.৫ ভরি রুপা = ৬১২.৩৬ গ্রাম।</span>
        </div>
      </div>
    </div>
  );
};
