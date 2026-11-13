import React, { useEffect, useRef, useState } from 'react';
import {
  BookMarked,
  CheckCircle2,
  Download,
  HelpCircle,
  Image as ImageIcon,
  Search,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import {
  ISLAMIC_ARTICLES,
  ISLAMIC_QUOTES_BN,
  QUIZ_QUESTIONS,
} from '../../data/islamicKnowledge';
import { DUAS_LIST } from '../../data/duas';
import { toBengaliDigits } from '../../utils/bengaliDigits';
import { offlineDB } from '../../utils/offlineStorage';
import { islamicApi } from '../../utils/islamicApiClient';
import wpKaaba from '../../assets/images/wallpaper_kaaba_night_1794572269441.jpg';
import wpMadinah from '../../assets/images/wallpaper_madinah_arch_1794572269157.jpg';
import wpGirih from '../../assets/images/wallpaper_geometric_noor_1794572269526.jpg';
import wpCrescent from '../../assets/images/wallpaper_crescent_mosque_1794572269557.jpg';

interface HadithEntry {
  hadithNumber: number;
  text: string;
  bookBn: string;
  bookEn: string;
  reference: string;
  grade: string;
}

export const HadithKnowledgeTool: React.FC = () => {
  const { isOnline, showToast } = useAppStore();
  const [subTab, setSubTab] = useState<'hadith' | 'articles' | 'quiz'>('hadith');
  const [book, setBook] = useState<'bukhari' | 'muslim' | 'tirmidhi' | 'abudawud'>('bukhari');
  const [page, setPage] = useState(1);
  const [hadithQuery, setHadithQuery] = useState('');
  const [hadiths, setHadiths] = useState<HadithEntry[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingHadith, setLoadingHadith] = useState(false);
  const [hadithError, setHadithError] = useState<string | null>(null);

  // Quiz state
  const [quizIdx, setQuizIdx] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  useEffect(() => {
    if (subTab !== 'hadith') return;
    const load = async () => {
      setLoadingHadith(true);
      setHadithError(null);
      try {
        if (!isOnline) {
          const cached = (await offlineDB.getHadithBook(book)) as HadithEntry[] | null;
          if (cached && cached.length > 0) {
            setHadiths(cached);
            setTotalPages(1);
            setLoadingHadith(false);
            return;
          }
          throw new Error('অফলাইন অবস্থায় এই হাদিস গ্রন্থটি ক্যাশে পাওয়া যায়নি।');
        }

        const data = await islamicApi.getHadith(book, page, 12, hadithQuery.trim());
        setHadiths(data.items || []);
        setTotalPages(data.totalPages || 1);
        if (page === 1 && !hadithQuery.trim() && Array.isArray(data.items)) {
          await offlineDB.saveHadithBook(book, data.items);
        }
      } catch (err) {
        setHadithError(err instanceof Error ? err.message : 'হাদিস লোড করা যায়নি।');
      } finally {
        setLoadingHadith(false);
      }
    };
    const timer = setTimeout(load, 250);
    return () => clearTimeout(timer);
  }, [book, page, hadithQuery, subTab, isOnline]);

  const currentQ = QUIZ_QUESTIONS[quizIdx];

  const handleAnswer = (optIdx: number) => {
    if (selectedOpt !== null) return;
    setSelectedOpt(optIdx);
    if (optIdx === currentQ.correctIndex) {
      setScore((s) => s + 1);
      showToast('সঠিক উত্তর!', 'success');
    }
  };

  const nextQuestion = () => {
    if (quizIdx + 1 < QUIZ_QUESTIONS.length) {
      setQuizIdx((i) => i + 1);
      setSelectedOpt(null);
    } else {
      setQuizFinished(true);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {([
          { id: 'hadith', bn: 'সহীহ হাদিস সংকলন', icon: BookMarked },
          { id: 'articles', bn: 'ইসলামিক শিক্ষা ও ইতিহাস', icon: Sparkles },
          { id: 'quiz', bn: 'ইসলামিক কুইজ', icon: HelpCircle },
        ] as const).map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setSubTab(item.id)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold ${
                subTab === item.id
                  ? 'bg-[#2457D6] text-white'
                  : 'bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.bn}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'hadith' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { key: 'bukhari' as const, label: 'সহীহ বুখারী' },
                { key: 'muslim' as const, label: 'সহীহ মুসলিম' },
                { key: 'tirmidhi' as const, label: 'তিরমিযী' },
                { key: 'abudawud' as const, label: 'আবু দাউদ' },
              ].map((b) => (
                <button
                  key={b.key}
                  onClick={() => {
                    setBook(b.key);
                    setPage(1);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap ${
                    book === b.key
                      ? 'bg-[#D92735] text-white'
                      : 'bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={hadithQuery}
                onChange={(e) => {
                  setHadithQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="হাদিস নম্বর বা বাংলা শব্দ লিখুন..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] pl-10 pr-4 py-2.5 text-sm"
              />
            </div>
          </div>

          {loadingHadith && (
            <div className="rounded-2xl bg-white dark:bg-[#19243A] p-8 text-center text-sm text-slate-500">
              যাচাইকৃত বাংলা হাদিস সংকলন লোড হচ্ছে...
            </div>
          )}

          {hadithError && (
            <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-[#D92735]/40 p-6 text-center text-sm text-[#D92735]">
              {hadithError}
            </div>
          )}

          {!loadingHadith && !hadithError && (
            <>
              <div className="space-y-3">
                {hadiths.map((h) => (
                  <article
                    key={`${book}_${h.hadithNumber}`}
                    className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-[#2457D6] dark:text-[#60A5FA]">
                        {h.bookBn} · হাদিস #{toBengaliDigits(h.hadithNumber)}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {h.reference} · {h.grade}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base text-[#10182B] dark:text-slate-100 leading-relaxed">
                      {h.text}
                    </p>
                  </article>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold disabled:opacity-40"
                  >
                    পূর্ববর্তী পাতা
                  </button>
                  <span className="text-xs text-slate-500 tabular-nums">
                    পৃষ্ঠা {toBengaliDigits(page)} / {toBengaliDigits(totalPages)}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="px-4 py-2 rounded-xl bg-[#2457D6] text-white text-xs font-semibold disabled:opacity-40"
                  >
                    পরবর্তী পাতা
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {subTab === 'articles' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {ISLAMIC_ARTICLES.map((art) => (
              <article
                key={art.id}
                className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#D92735]">{art.categoryBn}</span>
                  <span className="text-slate-400">{art.referenceBn}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#10182B] dark:text-white">
                  {art.titleBn}
                </h3>
                <p className="text-xs font-medium text-[#2457D6] dark:text-[#60A5FA]">{art.summaryBn}</p>
                <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {art.paragraphsBn.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5">
            <h3 className="text-base font-bold text-[#10182B] dark:text-white mb-3">ইসলামিক বাণী ও প্রেরণা</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {ISLAMIC_QUOTES_BN.map((q, i) => (
                <div key={i} className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-4">
                  <p className="text-sm font-medium text-[#10182B] dark:text-slate-100">“{q.quote}”</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">— {q.source}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {subTab === 'quiz' && (
        <div className="max-w-2xl mx-auto rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-6 space-y-5">
          {quizFinished ? (
            <div className="text-center space-y-4 py-4">
              <h3 className="text-xl font-bold text-[#10182B] dark:text-white">কুইজ সম্পন্ন হয়েছে!</h3>
              <p className="text-3xl font-bold text-[#2457D6] tabular-nums">
                স্কোর: {toBengaliDigits(score)} / {toBengaliDigits(QUIZ_QUESTIONS.length)}
              </p>
              <button
                onClick={() => {
                  setQuizIdx(0);
                  setSelectedOpt(null);
                  setScore(0);
                  setQuizFinished(false);
                }}
                className="rounded-xl bg-[#2457D6] px-6 py-2.5 text-sm font-semibold text-white"
              >
                পুনরায় কুইজ দিন
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  প্রশ্ন {toBengaliDigits(quizIdx + 1)} / {toBengaliDigits(QUIZ_QUESTIONS.length)}
                </span>
                <span className="font-semibold text-[#2457D6]">স্কোর: {toBengaliDigits(score)}</span>
              </div>
              <h3 className="text-lg font-bold text-[#10182B] dark:text-white">{currentQ.questionBn}</h3>
              <div className="space-y-2.5">
                {currentQ.optionsBn.map((opt, idx) => {
                  const isCorrect = idx === currentQ.correctIndex;
                  const isSelected = idx === selectedOpt;
                  let cls =
                    'border-slate-200 dark:border-slate-700 hover:border-[#2457D6] bg-[#F7F9FF] dark:bg-[#10182B]';
                  if (selectedOpt !== null) {
                    if (isCorrect) cls = 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300';
                    else if (isSelected) cls = 'border-[#D92735] bg-rose-50 dark:bg-rose-950/40 text-[#D92735]';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium flex items-center justify-between ${cls}`}
                    >
                      <span>{opt}</span>
                      {selectedOpt !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      {selectedOpt !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-[#D92735]" />}
                    </button>
                  );
                })}
              </div>
              {selectedOpt !== null && (
                <div className="rounded-xl bg-slate-100 dark:bg-slate-800 p-4 space-y-2">
                  <p className="text-xs sm:text-sm text-[#10182B] dark:text-slate-100">{currentQ.explanationBn}</p>
                  <p className="text-[11px] text-slate-500">সূত্র: {currentQ.referenceBn}</p>
                  <button
                    onClick={nextQuestion}
                    className="w-full rounded-xl bg-[#2457D6] py-2.5 text-xs font-semibold text-white mt-2"
                  >
                    {quizIdx + 1 < QUIZ_QUESTIONS.length ? 'পরবর্তী প্রশ্ন' : 'ফলাফল দেখুন'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

const GENERATED_WALLPAPERS = [
  {
    id: 'kaaba',
    titleBn: 'পবিত্র কাবা শরীফ (রাতের দৃশ্য)',
    src: wpKaaba,
  },
  {
    id: 'madinah',
    titleBn: 'মসজিদে নববী খিলানপথ',
    src: wpMadinah,
  },
  {
    id: 'girih',
    titleBn: 'নূর লাইফ জ্যামিতিক গিরিহ শিল্প',
    src: wpGirih,
  },
  {
    id: 'crescent',
    titleBn: 'গোধূলি মসজিদ ও বাঁকা চাঁদ',
    src: wpCrescent,
  },
];

export const WallpapersAndCardsTool: React.FC = () => {
  const { showToast } = useAppStore();
  const [selectedDuaIdx, setSelectedDuaIdx] = useState(0);
  const [cardTheme, setCardTheme] = useState<'blue' | 'red'>('blue');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const selectedDua = DUAS_LIST[selectedDuaIdx] || DUAS_LIST[0];

  const downloadGreetingCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1080;
    canvas.height = 1080;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1080);
    if (cardTheme === 'blue') {
      grad.addColorStop(0, '#2457D6');
      grad.addColorStop(1, '#10182B');
    } else {
      grad.addColorStop(0, '#D92735');
      grad.addColorStop(1, '#19243A');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle decorative frame
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 4;
    ctx.strokeRect(48, 48, 984, 984);

    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(selectedDua.titleBn, 540, 150);

    ctx.font = 'bold 46px serif';
    wrapText(ctx, selectedDua.arabic, 540, 310, 880, 74);

    ctx.fillStyle = '#E2E8F0';
    ctx.font = '28px sans-serif';
    wrapText(ctx, selectedDua.meaningBn, 540, 670, 860, 44);

    ctx.fillStyle = '#FCA5A5';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(`সূত্র: ${selectedDua.reference}`, 540, 920);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('নূর লাইফ — NOOR LIFE', 540, 985);

    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `noor-life-dua-card-${selectedDua.id}.png`;
    a.click();
    showToast('দোয়া কার্ড ডাউনলোড হয়েছে', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Generated Wallpapers */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-[#2457D6]" />
          <h2 className="text-lg font-bold text-[#10182B] dark:text-white">ইসলামিক ওয়ালপেপার</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {GENERATED_WALLPAPERS.map((wp) => (
            <div
              key={wp.id}
              className="rounded-2xl overflow-hidden bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 flex flex-col"
            >
              <div className="aspect-[9/16] bg-[#10182B] relative overflow-hidden">
                <img
                  src={wp.src}
                  alt={wp.titleBn}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[#10182B] dark:text-white truncate">{wp.titleBn}</p>
                <a
                  href={wp.src}
                  download={`${wp.id}.jpg`}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-xl bg-[#2457D6] text-white shrink-0"
                  aria-label={`${wp.titleBn} ডাউনলোড`}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shareable Dua Greeting Card Generator */}
      <section className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-4">
        <h2 className="text-lg font-bold text-[#10182B] dark:text-white">শেয়ারযোগ্য দোয়া ও শুভেচ্ছা কার্ড তৈরি</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-center">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1.5">দোয়া নির্বাচন করুন</label>
              <select
                value={selectedDuaIdx}
                onChange={(e) => setSelectedDuaIdx(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-3 py-2.5 text-sm"
              >
                {DUAS_LIST.map((d, i) => (
                  <option key={d.id} value={i}>
                    {d.titleBn}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCardTheme('blue')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border ${
                  cardTheme === 'blue' ? 'bg-[#2457D6] text-white border-[#2457D6]' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                রয়্যাল ব্লু থিম
              </button>
              <button
                onClick={() => setCardTheme('red')}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold border ${
                  cardTheme === 'red' ? 'bg-[#D92735] text-white border-[#D92735]' : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                ডিপ রেড থিম
              </button>
            </div>
            <button
              onClick={downloadGreetingCard}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#2457D6] py-3 text-sm font-semibold text-white hover:bg-[#1E47B8]"
            >
              <Download className="w-4 h-4" />
              PNG কার্ড ডাউনলোড করুন
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Live Preview */}
          <div
            className={`rounded-3xl p-6 text-white text-center space-y-3 border border-white/20 ${
              cardTheme === 'blue'
                ? 'bg-gradient-to-br from-[#2457D6] to-[#10182B]'
                : 'bg-gradient-to-br from-[#D92735] to-[#19243A]'
            }`}
          >
            <p className="text-sm font-bold">{selectedDua.titleBn}</p>
            <p className="font-arabic text-2xl leading-loose py-2">{selectedDua.arabic}</p>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">{selectedDua.meaningBn}</p>
            <p className="text-[11px] text-rose-200 font-semibold">সূত্র: {selectedDua.reference}</p>
            <p className="text-xs font-bold pt-2 border-t border-white/15">নূর লাইফ — NOOR LIFE</p>
          </div>
        </div>
      </section>
    </div>
  );
};

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, currY);
      line = words[n] + ' ';
      currY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, currY);
}
