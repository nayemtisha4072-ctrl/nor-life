import React, { useState } from 'react';
import { Bookmark, Copy, Search, Share2, Volume2 } from 'lucide-react';
import { DUA_CATEGORIES, DUAS_LIST } from '../../data/duas';
import { ASMA_UL_HUSNA } from '../../data/asmaUlHusna';
import { useAppStore } from '../../hooks/useAppStore';
import { toBengaliDigits } from '../../utils/bengaliDigits';

export const DuasLibraryTool: React.FC = () => {
  const { toggleBookmark, isBookmarked, showToast } = useAppStore();
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [query, setQuery] = useState('');

  const filtered = DUAS_LIST.filter((d) => {
    const matchesCat = selectedCat === 'all' || d.categoryId === selectedCat;
    const q = query.trim().toLowerCase();
    const matchesQ =
      !q ||
      d.titleBn.toLowerCase().includes(q) ||
      d.meaningBn.toLowerCase().includes(q) ||
      d.reference.toLowerCase().includes(q);
    return matchesCat && matchesQ;
  });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="দোয়ার নাম, অর্থ বা হাদিস সূত্র দিয়ে খুঁজুন..."
          className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] pl-10 pr-4 py-3 text-sm"
        />
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCat('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border ${
            selectedCat === 'all'
              ? 'bg-[#2457D6] text-white border-[#2457D6]'
              : 'bg-white dark:bg-[#19243A] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
          }`}
        >
          সকল দোয়া ({toBengaliDigits(DUAS_LIST.length)})
        </button>
        {DUA_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCat(cat.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border ${
              selectedCat === cat.id
                ? 'bg-[#2457D6] text-white border-[#2457D6]'
                : 'bg-white dark:bg-[#19243A] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
          >
            {cat.titleBn}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((dua) => {
          const bmId = `dua_${dua.id}`;
          const saved = isBookmarked(bmId);
          return (
            <article
              key={dua.id}
              className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 flex flex-col justify-between gap-3"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-[#10182B] dark:text-white">{dua.titleBn}</h3>
                    <p className="text-xs text-[#D92735] dark:text-[#F87171] mt-0.5">{dua.reference}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        toggleBookmark({
                          id: bmId,
                          type: 'dua',
                          titleBn: dua.titleBn,
                          subtitleBn: dua.meaningBn,
                          arabic: dua.arabic,
                          refData: { duaId: dua.id },
                        })
                      }
                      aria-label="প্রিয়তে রাখুন"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#D92735] text-[#D92735]' : 'text-slate-400'}`} />
                    </button>
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(
                          `${dua.titleBn}\n${dua.arabic}\nউচ্চারণ: ${dua.pronunciationBn}\nঅর্থ: ${dua.meaningBn}\nসূত্র: ${dua.reference}`
                        );
                        showToast('দোয়া কপি করা হয়েছে', 'success');
                      }}
                      aria-label="কপি"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={async () => {
                        const txt = `${dua.titleBn}\n${dua.arabic}\n${dua.meaningBn}\n(${dua.reference}) — নূর লাইফ`;
                        if (navigator.share) {
                          try {
                            await navigator.share({ title: dua.titleBn, text: txt });
                            return;
                          } catch {
                            // fallback
                          }
                        }
                        await navigator.clipboard.writeText(txt);
                        showToast('শেয়ারের জন্য কপি হয়েছে', 'success');
                      }}
                      aria-label="শেয়ার"
                      className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="font-arabic text-2xl text-right text-[#10182B] dark:text-white leading-loose">
                  {dua.arabic}
                </p>

                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  <strong className="text-[#2457D6] dark:text-[#60A5FA]">উচ্চারণ:</strong> {dua.pronunciationBn}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <strong>অর্থ:</strong> {dua.meaningBn}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};

export const AsmaUlHusnaTool: React.FC = () => {
  const { toggleBookmark, isBookmarked, showToast } = useAppStore();
  const [query, setQuery] = useState('');
  const [onlyFav, setOnlyFav] = useState(false);

  const filtered = ASMA_UL_HUSNA.filter((n) => {
    const favMatch = !onlyFav || isBookmarked(`name_${n.number}`);
    const q = query.trim().toLowerCase();
    const qMatch =
      !q ||
      n.pronunciationBn.toLowerCase().includes(q) ||
      n.meaningBn.toLowerCase().includes(q) ||
      n.meaningEn.toLowerCase().includes(q) ||
      String(n.number) === q;
    return favMatch && qMatch;
  });

  const speakArabicName = (arabic: string) => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(arabic);
        utt.lang = 'ar-SA';
        utt.rate = 0.85;
        window.speechSynthesis.speak(utt);
      } catch {
        showToast('উচ্চারণ অডিও এই ব্রাউজারে সমর্থিত নয়', 'info');
      }
    } else {
      showToast('উচ্চারণ অডিও এই ব্রাউজারে সমর্থিত নয়', 'info');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="আল্লাহর নাম বা অর্থ খুঁজুন (যেমন: রহমান, রিজিক, ৯৯)..."
            className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] pl-10 pr-4 py-3 text-sm"
          />
        </div>
        <button
          onClick={() => setOnlyFav((v) => !v)}
          className={`px-4 py-3 rounded-2xl text-xs font-semibold border whitespace-nowrap ${
            onlyFav
              ? 'bg-[#D92735] text-white border-[#D92735]'
              : 'bg-white dark:bg-[#19243A] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
          }`}
        >
          পছন্দসই নামসমূহ
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((n) => {
          const bmId = `name_${n.number}`;
          const saved = isBookmarked(bmId);
          return (
            <article
              key={n.number}
              className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-4 flex flex-col justify-between gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-[#2457D6] dark:text-[#60A5FA] tabular-nums">
                  {toBengaliDigits(n.number)}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => speakArabicName(n.arabic)}
                    aria-label="উচ্চারণ শুনুন"
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      toggleBookmark({
                        id: bmId,
                        type: 'name',
                        titleBn: `${n.pronunciationBn} (${n.meaningBn})`,
                        subtitleBn: n.explanationBn,
                        arabic: n.arabic,
                        refData: { number: n.number },
                      })
                    }
                    aria-label="প্রিয়"
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Bookmark className={`w-4 h-4 ${saved ? 'fill-[#D92735] text-[#D92735]' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>

              <div className="text-center py-1">
                <p className="font-arabic text-3xl text-[#10182B] dark:text-white">{n.arabic}</p>
                <h3 className="text-base font-bold text-[#2457D6] dark:text-[#60A5FA] mt-1">
                  {n.pronunciationBn}
                </h3>
                <p className="text-sm font-semibold text-[#D92735] dark:text-[#F87171]">{n.meaningBn}</p>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-2 border-t border-slate-100 dark:border-slate-800">
                {n.explanationBn}
              </p>
            </article>
          );
        })}
      </div>
    </div>
  );
};
