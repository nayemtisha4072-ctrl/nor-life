import React, { useEffect, useState } from 'react';
import { BookOpen, Heart, Search, Sparkles, X, ArrowRight } from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { SURAH_BENGALI_NAMES } from '../data/surahNamesBn';
import { DUAS_LIST } from '../data/duas';
import { ASMA_UL_HUSNA } from '../data/asmaUlHusna';
import { ISLAMIC_ARTICLES } from '../data/islamicKnowledge';
import { NAMAZ_SECTIONS } from '../data/namazWuduKalima';
import { toBengaliDigits } from '../utils/bengaliDigits';
import { islamicApi } from '../utils/islamicApiClient';

interface AyahMatch {
  number: number;
  numberInSurah: number;
  text: string;
  surahNumber: number;
  surahName: string;
  surahEnglishName: string;
}

export const GlobalSearchModal: React.FC = () => {
  const {
    isSearchOpen,
    setIsSearchOpen,
    setActiveTab,
    setOpenQuranAtSurah,
    setActiveToolId,
    isOnline,
    t,
  } = useAppStore();

  const [query, setQuery] = useState('');
  const [ayahMatches, setAyahMatches] = useState<AyahMatch[]>([]);
  const [searchingAyahs, setSearchingAyahs] = useState(false);

  useEffect(() => {
    const trimmed = query.trim();
    if (!isSearchOpen || trimmed.length < 3 || !isOnline) {
      setAyahMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingAyahs(true);
      try {
        const data = await islamicApi.searchQuran(trimmed);
        setAyahMatches(Array.isArray(data.matches) ? data.matches.slice(0, 8) : []);
      } catch {
        setAyahMatches([]);
      } finally {
        setSearchingAyahs(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [query, isSearchOpen, isOnline]);

  if (!isSearchOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedSurahs = q
    ? SURAH_BENGALI_NAMES.filter(
        (s) =>
          s.bn.toLowerCase().includes(q) ||
          s.meaningBn.toLowerCase().includes(q) ||
          String(s.number) === q
      ).slice(0, 6)
    : [];

  const matchedDuas = q
    ? DUAS_LIST.filter(
        (d) =>
          d.titleBn.toLowerCase().includes(q) ||
          d.meaningBn.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchedNames = q
    ? ASMA_UL_HUSNA.filter(
        (n) =>
          n.pronunciationBn.toLowerCase().includes(q) ||
          n.meaningBn.toLowerCase().includes(q) ||
          n.meaningEn.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const matchedArticles = q
    ? [...ISLAMIC_ARTICLES, ...NAMAZ_SECTIONS].filter(
        (a) =>
          a.titleBn.toLowerCase().includes(q) ||
          a.summaryBn.toLowerCase().includes(q)
      ).slice(0, 5)
    : [];

  const closeAndNavigate = (tab: 'quran' | 'namaz' | 'tools', toolId?: string, surahNum?: number) => {
    setIsSearchOpen(false);
    if (surahNum) setOpenQuranAtSurah(surahNum);
    if (toolId) setActiveToolId(toolId);
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-6 pt-10 sm:pt-16">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <Search className="w-5 h-5 text-[#2457D6] shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t(
              'সূরা, আয়াত, দোয়া, আল্লাহর নাম, নামাজ বা প্রবন্ধ খুঁজুন...',
              'Search Surahs, verses, Duas, Allah names, Salah guides...'
            )}
            className="flex-1 bg-transparent text-sm sm:text-base text-[#10182B] dark:text-white focus:outline-none py-1.5"
          />
          <button
            onClick={() => setIsSearchOpen(false)}
            aria-label={t('বন্ধ করুন', 'Close')}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-5">
          {!q && (
            <div className="text-center py-8 space-y-2">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {t('সবকিছু এক জায়গায় খুঁজুন', 'Search across the entire NOOR LIFE app')}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('উদাহরণ: ইয়াসীন, সিজদা, রিজিক, রহমান, নামাজ, যাকাত', 'Examples: Yasin, Ruku, Forgiveness, Rahman, Zakat')}
              </p>
            </div>
          )}

          {matchedSurahs.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t('কুরআনের সূরা', 'Quran Surahs')}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70">
                {matchedSurahs.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => closeAndNavigate('quran', undefined, s.number)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="w-4 h-4 text-[#2457D6]" />
                      <div>
                        <p className="text-sm font-semibold text-[#10182B] dark:text-white">
                          {toBengaliDigits(s.number)}. সূরা {s.bn}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {s.meaningBn} · {toBengaliDigits(s.ayahs)} আয়াত
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedDuas.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t('দোয়া ও জিকির', 'Duas & Adhkar')}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70">
                {matchedDuas.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => closeAndNavigate('tools', 'duas')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-4 h-4 text-[#D92735]" />
                      <div>
                        <p className="text-sm font-semibold text-[#10182B] dark:text-white">{d.titleBn}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{d.meaningBn}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedNames.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t('আল্লাহর ৯৯ নাম', '99 Names of Allah')}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70">
                {matchedNames.map((n) => (
                  <button
                    key={n.number}
                    onClick={() => closeAndNavigate('tools', 'names99')}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 text-[#2457D6]" />
                      <div>
                        <p className="text-sm font-semibold text-[#10182B] dark:text-white">
                          {n.pronunciationBn} ({n.arabic})
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{n.meaningBn}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {matchedArticles.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t('নামাজ ও ইসলামিক প্রবন্ধ', 'Salah & Islamic Knowledge')}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70">
                {matchedArticles.map((a) => (
                  <button
                    key={a.id}
                    onClick={() =>
                      closeAndNavigate(
                        NAMAZ_SECTIONS.some((ns) => ns.id === a.id) ? 'namaz' : 'tools',
                        NAMAZ_SECTIONS.some((ns) => ns.id === a.id) ? undefined : 'knowledge'
                      )
                    }
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#10182B] dark:text-white">{a.titleBn}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{a.summaryBn}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {searchingAyahs && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('কুরআনের আয়াতসমূহে অনুসন্ধান চলছে...', 'Searching Quran verses...')}
            </p>
          )}

          {ayahMatches.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                {t('কুরআনের আয়াতে প্রাপ্ত ফলাফল', 'Matching Quran Verses')}
              </h4>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/70">
                {ayahMatches.map((m) => (
                  <button
                    key={m.number}
                    onClick={() => closeAndNavigate('quran', undefined, m.surahNumber)}
                    className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <div className="pr-3">
                      <p className="text-xs font-semibold text-[#2457D6] dark:text-[#3478F6]">
                        সূরা {SURAH_BENGALI_NAMES[m.surahNumber - 1]?.bn || m.surahEnglishName} · আয়াত {toBengaliDigits(m.numberInSurah)}
                      </p>
                      <p className="text-sm text-[#10182B] dark:text-slate-200 line-clamp-2 mt-0.5">{m.text}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {q &&
            matchedSurahs.length === 0 &&
            matchedDuas.length === 0 &&
            matchedNames.length === 0 &&
            matchedArticles.length === 0 &&
            ayahMatches.length === 0 &&
            !searchingAyahs && (
              <p className="text-sm text-center text-slate-500 dark:text-slate-400 py-6">
                {t('কোনো ফলাফল পাওয়া যায়নি। ভিন্ন শব্দ দিয়ে চেষ্টা করুন।', 'No matching results found.')}
              </p>
            )}
        </div>
      </div>
    </div>
  );
};
