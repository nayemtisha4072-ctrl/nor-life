import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Bookmark,
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  Play,
  Search,
  Share2,
  SlidersHorizontal,
  Volume2,
  X,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { AudioTrack } from '../hooks/useAudioPlayer';
import {
  approximateArabicToBengaliPronunciation,
  FALLBACK_SURAH_META,
  SURAH_BENGALI_NAMES,
} from '../data/surahNamesBn';
import { AyahItem, SurahDetail, SurahMeta } from '../types';
import { offlineDB, storage } from '../utils/offlineStorage';
import { toBengaliDigits } from '../utils/bengaliDigits';
import { islamicApi } from '../utils/islamicApiClient';

interface Props {
  audioPlayer: {
    currentTrack: AudioTrack | null;
    isPlaying: boolean;
    loadAndPlay: (tracks: AudioTrack[], startIndex?: number) => void;
    togglePlay: () => void;
  };
}

const RECITERS = [
  { id: 'ar.alafasy', labelBn: 'মিশারি রশিদ আল-আফাসি' },
  { id: 'ar.abdurrahmaansudais', labelBn: 'আবদুর রহমান আস-সুদাইস' },
  { id: 'ar.abdulbasitmurattal', labelBn: 'আবদুল বাসিত (মুরাত্তাল)' },
  { id: 'ar.husary', labelBn: 'মাহমুদ খলিল আল-হুসারি' },
  { id: 'ar.minshawi', labelBn: 'মুহাম্মদ সিদ্দিক আল-মিনশাবি' },
];

export const QuranModule: React.FC<Props> = ({ audioPlayer }) => {
  const {
    settings,
    updateSettings,
    openQuranAtSurah,
    setOpenQuranAtSurah,
    bookmarks,
    toggleBookmark,
    isBookmarked,
    saveNote,
    trackRecent,
    isOnline,
    showToast,
    t,
  } = useAppStore();

  const [subTab, setSubTab] = useState<'surah' | 'juz' | 'bookmarks'>('surah');
  const [surahs, setSurahs] = useState<SurahMeta[]>(FALLBACK_SURAH_META);
  const [cachedSurahNums, setCachedSurahNums] = useState<number[]>([]);
  const [searchQ, setSearchQ] = useState('');

  const [activeSurah, setActiveSurah] = useState<SurahDetail | null>(null);
  const [activeJuz, setActiveJuz] = useState<{ juz: number; ayahs: AyahItem[] } | null>(null);
  const [loadingReader, setLoadingReader] = useState(false);
  const [readerError, setReaderError] = useState<string | null>(null);
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  // Tafsir drawer state
  const [tafsirModal, setTafsirModal] = useState<{
    surah: number;
    ayah: number;
    loading: boolean;
    source?: string;
    text?: string;
    error?: string;
  } | null>(null);

  // Downloading Surah audio progress
  const [downloadingAudio, setDownloadingAudio] = useState<string | null>(null);

  useEffect(() => {
    const loadSurahs = async () => {
      const cachedList = await offlineDB.getSurahList();
      if (cachedList && cachedList.length === 114) {
        setSurahs(cachedList);
      }
      const cachedNums = await offlineDB.getCachedSurahNumbers();
      setCachedSurahNums(cachedNums);

      if (isOnline) {
        try {
          const raw = await islamicApi.getSurahs();
          const merged: SurahMeta[] = raw.map((r: { number: number; name: string; englishName: string; englishNameTranslation: string; numberOfAyahs: number; revelationType: 'Meccan' | 'Medinan' }) => {
            const bn = SURAH_BENGALI_NAMES[r.number - 1];
            return {
              ...r,
              bengaliName: bn?.bn || r.englishName,
              bengaliMeaning: bn?.meaningBn || r.englishNameTranslation,
            };
          });
          setSurahs(merged);
          await offlineDB.saveSurahList(merged);
        } catch {
          // keep fallback/cached list
        }
      }
    };
    loadSurahs();
  }, [isOnline]);

  const openSurah = async (surahNumber: number, reciterOverride?: string) => {
    const reciterToUse = reciterOverride || settings.reciter;
    setLoadingReader(true);
    setReaderError(null);
    setActiveJuz(null);

    try {
      // Check offline cache first if offline or reciter matches
      const cached = await offlineDB.getSurah(surahNumber);
      if (cached && (!isOnline || cached.reciter === reciterToUse)) {
        setActiveSurah(cached);
        const bnName = SURAH_BENGALI_NAMES[surahNumber - 1]?.bn || cached.englishName;
        storage.saveLastRead({
          surahNumber,
          surahName: `সূরা ${bnName}`,
          ayahNumber: 1,
          timestamp: Date.now(),
        });
        trackRecent(`surah_${surahNumber}`, `সূরা ${bnName}`, 'কুরআন');
        setLoadingReader(false);
        return;
      }

      if (!isOnline && !cached) {
        setReaderError('ইন্টারনেট সংযোগ নেই এবং এই সূরাটি অফলাইনে সংরক্ষিত নেই।');
        setLoadingReader(false);
        return;
      }

      const data = await islamicApi.getSurah(surahNumber, reciterToUse);

      setActiveSurah(data);
      await offlineDB.saveSurah(data);
      setCachedSurahNums((prev) => (prev.includes(surahNumber) ? prev : [...prev, surahNumber]));

      const bnName = SURAH_BENGALI_NAMES[surahNumber - 1]?.bn || data.englishName;
      storage.saveLastRead({
        surahNumber,
        surahName: `সূরা ${bnName}`,
        ayahNumber: 1,
        timestamp: Date.now(),
      });
      trackRecent(`surah_${surahNumber}`, `সূরা ${bnName}`, 'কুরআন');
    } catch (err) {
      setReaderError(err instanceof Error ? err.message : 'সূরা লোড করা যায়নি।');
    } finally {
      setLoadingReader(false);
    }
  };

  useEffect(() => {
    if (openQuranAtSurah) {
      openSurah(openQuranAtSurah);
      setOpenQuranAtSurah(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openQuranAtSurah]);

  const openJuz = async (juzNum: number) => {
    if (!isOnline) {
      showToast(t('পারা লোড করতে ইন্টারনেট প্রয়োজন', 'Internet required to load Juz'), 'error');
      return;
    }
    setLoadingReader(true);
    setReaderError(null);
    setActiveSurah(null);
    try {
      const data = await islamicApi.getJuz(juzNum);
      setActiveJuz(data);
    } catch (err) {
      setReaderError(err instanceof Error ? err.message : 'পারা লোড ব্যর্থ');
    } finally {
      setLoadingReader(false);
    }
  };

  const openTafsir = async (surah: number, ayah: number) => {
    setTafsirModal({ surah, ayah, loading: true });
    try {
      const data = await islamicApi.getTafsir(surah, ayah);
      setTafsirModal({
        surah,
        ayah,
        loading: false,
        source: data.source,
        text: data.text,
      });
    } catch (err) {
      setTafsirModal({
        surah,
        ayah,
        loading: false,
        error: err instanceof Error ? err.message : 'তাফসীর লোড করা যায়নি',
      });
    }
  };

  const playSurahFrom = (surah: SurahDetail, startIndex = 0) => {
    const bnName = SURAH_BENGALI_NAMES[surah.number - 1]?.bn || surah.englishName;
    const tracks: AudioTrack[] = surah.ayahs
      .filter((a) => Boolean(a.audio))
      .map((a) => ({
        id: `${surah.number}:${a.numberInSurah}`,
        title: `সূরা ${bnName} · আয়াত ${toBengaliDigits(a.numberInSurah)}`,
        subtitle: RECITERS.find((r) => r.id === surah.reciter)?.labelBn || 'তিলাওয়াত',
        url: a.audio,
        surahNumber: surah.number,
        ayahNumber: a.numberInSurah,
      }));
    if (tracks.length === 0) {
      showToast(t('এই সূরার অডিও পাওয়া যায়নি', 'Audio unavailable for this Surah'), 'error');
      return;
    }
    audioPlayer.loadAndPlay(tracks, startIndex);
  };

  const downloadSurahOffline = async (surah: SurahDetail) => {
    if (!isOnline) {
      showToast(t('ডাউনলোড করতে ইন্টারনেট প্রয়োজন', 'Internet required to download'), 'error');
      return;
    }
    await offlineDB.saveSurah(surah);
    const total = surah.ayahs.length;
    setDownloadingAudio(`০/${toBengaliDigits(total)}`);
    let saved = 0;
    for (const ayah of surah.ayahs) {
      if (ayah.audio) {
        try {
          const existing = await offlineDB.getAudioBlob(ayah.audio);
          if (!existing) {
            const resp = await fetch(ayah.audio);
            if (resp.ok) {
              const blob = await resp.blob();
              await offlineDB.saveAudioBlob(ayah.audio, blob);
            }
          }
        } catch {
          // continue remaining ayahs
        }
      }
      saved += 1;
      setDownloadingAudio(`${toBengaliDigits(saved)}/${toBengaliDigits(total)}`);
    }
    setDownloadingAudio(null);
    showToast(t('সূরা ও অডিও অফলাইনে সংরক্ষিত হয়েছে', 'Surah text & audio saved offline'), 'success');
  };

  const readingBgClass =
    settings.quranReadingTheme === 'sepia'
      ? 'bg-[#FBF5E6] text-[#2C2217] border-[#E6D8B8]'
      : settings.quranReadingTheme === 'night'
        ? 'bg-[#0F172A] text-slate-100 border-slate-800'
        : 'bg-white dark:bg-[#19243A] text-[#10182B] dark:text-slate-100 border-slate-200 dark:border-slate-700/60';

  // If reading a Surah or Juz
  if (activeSurah || activeJuz || loadingReader || readerError) {
    const surahBnMeta = activeSurah ? SURAH_BENGALI_NAMES[activeSurah.number - 1] : null;
    return (
      <div className="space-y-4">
        {/* Top Reader Toolbar */}
        <div className="sticky top-[60px] z-20 rounded-2xl bg-white/95 dark:bg-[#19243A]/95 backdrop-blur-md border border-slate-200 dark:border-slate-700/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setActiveSurah(null);
                setActiveJuz(null);
                setReaderError(null);
              }}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-[#10182B] dark:text-white hover:bg-slate-200 dark:hover:bg-slate-700"
              aria-label={t('ফিরে যান', 'Back')}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#10182B] dark:text-white">
                {activeSurah
                  ? `${toBengaliDigits(activeSurah.number)}. সূরা ${surahBnMeta?.bn || activeSurah.englishName}`
                  : activeJuz
                    ? `পারা (জুজ) ${toBengaliDigits(activeJuz.juz)}`
                    : t('লোড হচ্ছে...', 'Loading...')}
              </h2>
              {activeSurah && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {surahBnMeta?.meaningBn} · {activeSurah.revelationType === 'Meccan' ? 'মক্কী' : 'মাদানী'} · {toBengaliDigits(activeSurah.numberOfAyahs)} আয়াত
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSurah && (
              <>
                <button
                  onClick={() => playSurahFrom(activeSurah, 0)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E47B8] min-h-[40px]"
                >
                  <Play className="w-4 h-4" />
                  {t('তিলাওয়াত শুনুন', 'Play Audio')}
                </button>
                <button
                  onClick={() => downloadSurahOffline(activeSurah)}
                  disabled={downloadingAudio !== null}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-[#10182B] dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 min-h-[40px]"
                >
                  <Download className="w-4 h-4" />
                  {downloadingAudio ? downloadingAudio : t('অফলাইন', 'Save Offline')}
                </button>
              </>
            )}
            <button
              onClick={() => setShowSettingsDrawer((v) => !v)}
              aria-label={t('পাঠ্য সেটিংস', 'Reading settings')}
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Reading Settings Drawer */}
        {showSettingsDrawer && (
          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('আরবি ফন্ট সাইজ', 'Arabic Size')}: {toBengaliDigits(settings.arabicFontSize)}px
              </label>
              <input
                type="range"
                min={20}
                max={44}
                value={settings.arabicFontSize}
                onChange={(e) => updateSettings({ arabicFontSize: Number(e.target.value) })}
                className="w-full mt-2 accent-[#2457D6]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('বাংলা ফন্ট সাইজ', 'Bengali Size')}: {toBengaliDigits(settings.bengaliFontSize)}px
              </label>
              <input
                type="range"
                min={14}
                max={24}
                value={settings.bengaliFontSize}
                onChange={(e) => updateSettings({ bengaliFontSize: Number(e.target.value) })}
                className="w-full mt-2 accent-[#2457D6]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {t('ক্বারী নির্বাচন', 'Reciter')}
              </label>
              <select
                value={settings.reciter}
                onChange={(e) => {
                  const rec = e.target.value;
                  updateSettings({ reciter: rec });
                  if (activeSurah) openSurah(activeSurah.number, rec);
                }}
                className="w-full mt-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2 text-xs text-[#10182B] dark:text-white"
              >
                {RECITERS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.labelBn}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {(['default', 'sepia', 'night'] as const).map((themeKey) => (
                  <button
                    key={themeKey}
                    onClick={() => updateSettings({ quranReadingTheme: themeKey })}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      settings.quranReadingTheme === themeKey
                        ? 'border-[#2457D6] bg-[#2457D6]/10 text-[#2457D6]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {themeKey === 'default' ? 'সাধারণ' : themeKey === 'sepia' ? 'ক্লাসিক' : 'রাত্রি'}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showPronunciation}
                    onChange={(e) => updateSettings({ showPronunciation: e.target.checked })}
                    className="accent-[#2457D6]"
                  />
                  <span>বাংলা উচ্চারণ সহায়ক</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.showEnglishTranslation}
                    onChange={(e) => updateSettings({ showEnglishTranslation: e.target.checked })}
                    className="accent-[#2457D6]"
                  />
                  <span>English</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {loadingReader && (
          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 p-12 text-center">
            <div className="w-8 h-8 border-2 border-[#2457D6] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">
              {t('কুরআনের আয়াত ও অনুবাদ লোড হচ্ছে...', 'Loading authentic Quran text & translation...')}
            </p>
          </div>
        )}

        {readerError && (
          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-[#D92735]/40 p-8 text-center space-y-3">
            <p className="text-sm font-medium text-[#D92735]">{readerError}</p>
            <button
              onClick={() => activeSurah && openSurah(activeSurah.number)}
              className="rounded-xl bg-[#2457D6] px-4 py-2 text-xs font-semibold text-white"
            >
              {t('আবার চেষ্টা করুন', 'Retry')}
            </button>
          </div>
        )}

        {/* Bismillah header for Surahs except Tawbah (9) and Fatiha (1) */}
        {!loadingReader && !readerError && activeSurah && activeSurah.number !== 9 && activeSurah.number !== 1 && (
          <div className={`rounded-2xl border p-5 text-center ${readingBgClass}`}>
            <p className="font-arabic text-2xl sm:text-3xl">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</p>
            <p className="text-xs opacity-75 mt-1">পরম করুণাময় অসীম দয়ালু আল্লাহর নামে শুরু করছি</p>
          </div>
        )}

        {/* Ayahs List */}
        {!loadingReader && !readerError && (activeSurah || activeJuz) && (
          <div className="space-y-3">
            {(activeSurah?.ayahs || activeJuz?.ayahs || []).map((ayah, idx) => {
              const sNum = activeSurah?.number || ayah.surahNumber || 1;
              const sNameBn = SURAH_BENGALI_NAMES[sNum - 1]?.bn || ayah.surahNameEn || '';
              const bmId = `ayah_${sNum}_${ayah.numberInSurah}`;
              const bookmarked = isBookmarked(bmId);
              const isPlayingThis =
                audioPlayer.isPlaying &&
                audioPlayer.currentTrack?.id === `${sNum}:${ayah.numberInSurah}`;

              return (
                <article
                  key={`${sNum}_${ayah.numberInSurah}_${idx}`}
                  className={`rounded-2xl border p-5 transition-colors ${readingBgClass} ${
                    isPlayingThis ? 'ring-2 ring-[#2457D6]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-black/5 dark:border-white/10">
                    <span className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA] tabular-nums">
                      সূরা {sNameBn} · আয়াত {toBengaliDigits(ayah.numberInSurah)}
                      {ayah.sajda ? ' · সিজদাহ আয়াত' : ''}
                    </span>

                    <div className="flex items-center gap-1">
                      {activeSurah && ayah.audio && (
                        <button
                          onClick={() => playSurahFrom(activeSurah, idx)}
                          title={t('এই আয়াত শুনুন', 'Play Ayah')}
                          className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                        >
                          <Volume2 className={`w-4 h-4 ${isPlayingThis ? 'text-[#D92735]' : ''}`} />
                        </button>
                      )}
                      <button
                        onClick={() => openTafsir(sNum, ayah.numberInSurah)}
                        title={t('তাফসীর পড়ুন', 'Read Tafsir')}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>তাফসীর</span>
                      </button>
                      <button
                        onClick={() => {
                          toggleBookmark({
                            id: bmId,
                            type: 'ayah',
                            titleBn: `সূরা ${sNameBn} · আয়াত ${toBengaliDigits(ayah.numberInSurah)}`,
                            subtitleBn: ayah.bengali,
                            arabic: ayah.arabic,
                            refData: { surah: sNum, ayah: ayah.numberInSurah },
                          });
                        }}
                        aria-label={t('বুকমার্ক', 'Bookmark')}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-[#D92735] text-[#D92735]' : ''}`} />
                      </button>
                      <button
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            `${ayah.arabic}\n${ayah.bengali}\n— সূরা ${sNameBn}, আয়াত ${toBengaliDigits(ayah.numberInSurah)}`
                          );
                          showToast(t('আয়াত কপি করা হয়েছে', 'Verse copied'), 'success');
                        }}
                        aria-label={t('কপি', 'Copy')}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          saveNote({
                            id: `note_${bmId}`,
                            title: `সূরা ${sNameBn} (${toBengaliDigits(ayah.numberInSurah)})`,
                            content: ayah.bengali,
                            reference: `${sNum}:${ayah.numberInSurah}`,
                          });
                        }}
                        title={t('ব্যক্তিগত নোটে সংরক্ষণ', 'Save to Personal Notes')}
                        className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p
                    className="font-arabic text-right mt-4 mb-3"
                    style={{ fontSize: `${settings.arabicFontSize}px` }}
                  >
                    {ayah.arabic}
                  </p>

                  {settings.showPronunciation && (
                    <p className="text-xs opacity-70 mb-2 leading-relaxed">
                      উচ্চারণ সহায়ক: {approximateArabicToBengaliPronunciation(ayah.arabic)}
                    </p>
                  )}

                  <p
                    className="leading-relaxed font-medium"
                    style={{ fontSize: `${settings.bengaliFontSize}px` }}
                  >
                    {ayah.bengali}
                  </p>

                  {settings.showEnglishTranslation && ayah.english && (
                    <p className="text-sm opacity-80 mt-2 leading-relaxed">
                      {ayah.english}
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {/* Tafsir Modal */}
        {tafsirModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
            <div className="w-full max-w-2xl rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 max-h-[82vh] flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-[#10182B] dark:text-white">
                    তাফসীর · সূরা {SURAH_BENGALI_NAMES[tafsirModal.surah - 1]?.bn}, আয়াত {toBengaliDigits(tafsirModal.ayah)}
                  </h3>
                  {tafsirModal.source && (
                    <p className="text-xs text-[#2457D6] dark:text-[#60A5FA] mt-0.5">{tafsirModal.source}</p>
                  )}
                </div>
                <button
                  onClick={() => setTafsirModal(null)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed">
                {tafsirModal.loading && <p>যাচাইকৃত তাফসীর লোড হচ্ছে...</p>}
                {tafsirModal.error && <p className="text-[#D92735]">{tafsirModal.error}</p>}
                {tafsirModal.text && <p className="whitespace-pre-line">{tafsirModal.text}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  const filteredSurahs = surahs.filter(
    (s) =>
      s.bengaliName.toLowerCase().includes(searchQ.trim().toLowerCase()) ||
      s.bengaliMeaning.toLowerCase().includes(searchQ.trim().toLowerCase()) ||
      s.englishName.toLowerCase().includes(searchQ.trim().toLowerCase()) ||
      String(s.number) === searchQ.trim()
  );

  const ayahBookmarks = bookmarks.filter((b) => b.type === 'ayah');

  return (
    <div className="space-y-5">
      {/* Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#10182B] dark:text-white">
            {t('আল-কুরআনুল কারীম', 'The Holy Quran')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {t('১১৪টি সূরা ও ৩০ পারা · প্রামাণ্য আরবি পাঠ, বাংলা অনুবাদ, তাফসীর ও অডিও', 'All 114 Surahs & 30 Juz · Verified Arabic, Bengali translation, Tafsir & Audio')}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-[#19243A] border border-slate-200 dark:border-slate-700/60 self-start">
          {([
            { id: 'surah', bn: 'সূরা (১১৪)', en: 'Surahs' },
            { id: 'juz', bn: 'পারা (৩০)', en: 'Juz' },
            { id: 'bookmarks', bn: 'বুকমার্ক', en: 'Bookmarks' },
          ] as const).map((item) => (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                subTab === item.id
                  ? 'bg-[#2457D6] text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#10182B] dark:hover:text-white'
              }`}
            >
              {t(item.bn, item.en)}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'surah' && (
        <>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder={t('সূরার নাম বা নম্বর দিয়ে খুঁজুন (যেমন: ইয়াসীন, ৩৬)...', 'Search Surah by name or number...')}
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] pl-10 pr-4 py-3 text-sm text-[#10182B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2457D6]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSurahs.map((s) => {
              const isCached = cachedSurahNums.includes(s.number);
              return (
                <button
                  key={s.number}
                  onClick={() => openSurah(s.number)}
                  className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 text-left flex items-center justify-between gap-3 hover:border-[#2457D6] transition-colors min-h-[76px]"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA] font-bold text-sm flex items-center justify-center shrink-0 tabular-nums">
                      {toBengaliDigits(s.number)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#10182B] dark:text-white truncate">
                        সূরা {s.bengaliName}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {s.bengaliMeaning} · {s.revelationType === 'Meccan' ? 'মক্কী' : 'মাদানী'} · {toBengaliDigits(s.numberOfAyahs)} আয়াত
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-arabic text-lg text-[#10182B] dark:text-slate-100">{s.name}</p>
                    {isCached && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        <Check className="w-3 h-3" /> অফলাইন
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      {subTab === 'juz' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-3">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juz) => (
            <button
              key={juz}
              onClick={() => openJuz(juz)}
              className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 text-center hover:border-[#2457D6] transition-colors min-h-[84px] flex flex-col items-center justify-center gap-1"
            >
              <BookOpen className="w-5 h-5 text-[#2457D6]" />
              <span className="text-sm font-bold text-[#10182B] dark:text-white">
                পারা {toBengaliDigits(juz)}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">জুজ {toBengaliDigits(juz)}</span>
            </button>
          ))}
        </div>
      )}

      {subTab === 'bookmarks' && (
        <div className="space-y-3">
          {ayahBookmarks.length === 0 ? (
            <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {t('কোনো আয়াত এখনো বুকমার্ক করা হয়নি।', 'No Quran verses bookmarked yet.')}
              </p>
            </div>
          ) : (
            ayahBookmarks.map((bm) => (
              <div
                key={bm.id}
                className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 flex items-center justify-between gap-4"
              >
                <button
                  onClick={() => openSurah(Number(bm.refData.surah || 1))}
                  className="text-left flex-1 min-w-0"
                >
                  <p className="text-sm font-bold text-[#2457D6] dark:text-[#60A5FA]">{bm.titleBn}</p>
                  {bm.arabic && (
                    <p className="font-arabic text-lg text-right text-[#10182B] dark:text-white mt-1 truncate">
                      {bm.arabic}
                    </p>
                  )}
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {bm.subtitleBn}
                  </p>
                </button>
                <button
                  onClick={() => toggleBookmark(bm)}
                  className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#D92735] hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Bookmark className="w-4 h-4 fill-current" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
