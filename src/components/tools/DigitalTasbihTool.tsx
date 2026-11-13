import React, { useState } from 'react';
import { Plus, RotateCcw, Volume2, VolumeX, Smartphone, Trash2, CheckCircle2 } from 'lucide-react';
import { storage } from '../../utils/offlineStorage';
import { TasbihHistoryEntry, TasbihSession } from '../../types';
import { toBengaliDigits } from '../../utils/bengaliDigits';
import { playGentleTone } from '../../hooks/useAudioPlayer';
import { useAppStore } from '../../hooks/useAppStore';

export const DigitalTasbihTool: React.FC = () => {
  const { showToast, t } = useAppStore();
  const [sessions, setSessions] = useState<TasbihSession[]>(() => storage.getTasbihSessions());
  const [activeId, setActiveId] = useState<string>(() => sessions[0]?.id || 'subhanallah');
  const [history, setHistory] = useState<TasbihHistoryEntry[]>(() => storage.getTasbihHistory());

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrateEnabled, setVibrateEnabled] = useState(true);
  const [confirmReset, setConfirmReset] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  const [newTitle, setNewTitle] = useState('');
  const [newArabic, setNewArabic] = useState('');
  const [newTarget, setNewTarget] = useState(33);

  const activeSession = sessions.find((s) => s.id === activeId) || sessions[0];
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayHistory = history.find((h) => h.date === todayStr);

  const updateSessions = (next: TasbihSession[]) => {
    setSessions(next);
    storage.saveTasbihSessions(next);
  };

  const handleTap = () => {
    if (!activeSession) return;
    if (soundEnabled) playGentleTone('tap');
    if (vibrateEnabled && navigator.vibrate) {
      navigator.vibrate(20);
    }

    const nextCount = activeSession.count + 1;
    const hitTarget = nextCount === activeSession.target;

    if (hitTarget && vibrateEnabled && navigator.vibrate) {
      navigator.vibrate([40, 40, 80]);
    }

    const updated = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, count: nextCount } : s
    );
    updateSessions(updated);

    // Update daily history
    const nextHistory = [...history];
    const idx = nextHistory.findIndex((h) => h.date === todayStr);
    if (idx >= 0) {
      nextHistory[idx] = {
        ...nextHistory[idx],
        totalCount: nextHistory[idx].totalCount + 1,
        sessionsCompleted: nextHistory[idx].sessionsCompleted + (hitTarget ? 1 : 0),
      };
    } else {
      nextHistory.unshift({
        date: todayStr,
        totalCount: 1,
        sessionsCompleted: hitTarget ? 1 : 0,
      });
    }
    const trimmedHistory = nextHistory.slice(0, 30);
    setHistory(trimmedHistory);
    storage.saveTasbihHistory(trimmedHistory);

    if (hitTarget) {
      showToast(
        t(`মাশাআল্লাহ! ${activeSession.titleBn} লক্ষ্যমাত্রা পূর্ণ হয়েছে`, `Target reached for ${activeSession.titleBn}`),
        'success'
      );
    }
  };

  const handleReset = () => {
    const updated = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, count: 0 } : s
    );
    updateSessions(updated);
    setConfirmReset(false);
    showToast(t('কাউন্টার রিসেট করা হয়েছে', 'Counter reset'), 'info');
  };

  const handleTargetChange = (val: number) => {
    const target = Math.max(1, val);
    const updated = sessions.map((s) =>
      s.id === activeSession.id ? { ...s, target } : s
    );
    updateSessions(updated);
  };

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const created: TasbihSession = {
      id: `custom_${Date.now()}`,
      titleBn: newTitle.trim(),
      arabic: newArabic.trim() || newTitle.trim(),
      pronunciation: newTitle.trim(),
      meaningBn: 'ব্যক্তিগত জিকির',
      count: 0,
      target: Math.max(1, newTarget),
    };
    const next = [...sessions, created];
    updateSessions(next);
    setActiveId(created.id);
    setNewTitle('');
    setNewArabic('');
    setNewTarget(33);
    setShowAddForm(false);
  };

  const progressPct = Math.min(100, Math.round((activeSession.count / activeSession.target) * 100));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Main Tactile Counter */}
      <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-6 flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between gap-2 mb-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-[#10182B] dark:text-white">{activeSession.titleBn}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{activeSession.meaningBn}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSoundEnabled((v) => !v)}
              aria-label="শব্দ টগল"
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border ${
                soundEnabled
                  ? 'border-[#2457D6] text-[#2457D6] bg-[#2457D6]/10'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setVibrateEnabled((v) => !v)}
              aria-label="ভাইব্রেশন টগল"
              className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border ${
                vibrateEnabled
                  ? 'border-[#2457D6] text-[#2457D6] bg-[#2457D6]/10'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
            <button
              onClick={() => setConfirmReset(true)}
              aria-label="রিসেট করুন"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[#D92735]/30 text-[#D92735] hover:bg-[#D92735]/10"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <p className="font-arabic text-2xl sm:text-3xl text-[#10182B] dark:text-white my-2">
          {activeSession.arabic}
        </p>

        {/* Big Tap Button */}
        <button
          onClick={handleTap}
          className="my-5 w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-gradient-to-br from-[#2457D6] to-[#10182B] text-white shadow-xl active:scale-95 transition-transform flex flex-col items-center justify-center relative select-none"
        >
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke="#D92735"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${progressPct * 2.89} 289`}
            />
          </svg>
          <span className="text-xs text-blue-200">ট্যাপ করে গণনা করুন</span>
          <span className="text-5xl sm:text-6xl font-bold font-display tabular-nums mt-1">
            {toBengaliDigits(activeSession.count)}
          </span>
          <span className="text-xs text-blue-200 mt-2 tabular-nums">
            লক্ষ্য: {toBengaliDigits(activeSession.target)} ({toBengaliDigits(progressPct)}%)
          </span>
        </button>

        {/* Target Quick Controls */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {[33, 99, 100, 1000].map((val) => (
            <button
              key={val}
              onClick={() => handleTargetChange(val)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border tabular-nums ${
                activeSession.target === val
                  ? 'bg-[#D92735] text-white border-[#D92735]'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              লক্ষ্য {toBengaliDigits(val)}
            </button>
          ))}
          <input
            type="number"
            min={1}
            value={activeSession.target}
            onChange={(e) => handleTargetChange(Number(e.target.value) || 33)}
            aria-label="কাস্টম লক্ষ্য"
            className="w-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] px-2.5 py-1.5 text-xs text-center tabular-nums"
          />
        </div>
      </div>

      {/* Right Column: Dhikr Presets & Daily History */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#10182B] dark:text-white">জিকির নির্বাচন করুন</h3>
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA]"
            >
              <Plus className="w-4 h-4" /> নতুন জিকির
            </button>
          </div>

          {showAddForm && (
            <form onSubmit={handleCreateCustom} className="p-3 rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] space-y-2.5">
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="জিকিরের নাম (যেমন: সুবহানাল্লাহি ওয়া বিহামদিহি)"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] px-3 py-2 text-xs"
              />
              <input
                type="text"
                value={newArabic}
                onChange={(e) => setNewArabic(e.target.value)}
                placeholder="আরবি পাঠ (ঐচ্ছিক)"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] px-3 py-2 text-xs"
              />
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={newTarget}
                  onChange={(e) => setNewTarget(Number(e.target.value) || 33)}
                  className="w-24 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#19243A] px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="flex-1 rounded-lg bg-[#2457D6] py-2 text-xs font-semibold text-white"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2 max-h-72 overflow-y-auto">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={`flex items-center justify-between gap-2 p-3 rounded-xl border transition-colors ${
                  s.id === activeSession.id
                    ? 'border-[#2457D6] bg-[#2457D6]/8 dark:bg-[#2457D6]/15'
                    : 'border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <button
                  onClick={() => setActiveId(s.id)}
                  className="flex-1 text-left min-w-0"
                >
                  <p className="text-sm font-semibold text-[#10182B] dark:text-white truncate">{s.titleBn}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    গণনা: {toBengaliDigits(s.count)} / {toBengaliDigits(s.target)}
                  </p>
                </button>
                {s.id.startsWith('custom_') && (
                  <button
                    onClick={() => {
                      const next = sessions.filter((x) => x.id !== s.id);
                      updateSessions(next);
                      if (activeId === s.id) setActiveId(next[0].id);
                    }}
                    className="p-2 text-[#D92735]"
                    aria-label="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Daily History */}
        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#10182B] dark:text-white">দৈনিক তাসবিহ ইতিহাস</h3>
            <span className="text-xs font-semibold text-[#2457D6] dark:text-[#60A5FA] tabular-nums">
              আজ: {toBengaliDigits(todayHistory?.totalCount || 0)} বার
            </span>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400">এখনো কোনো জিকির রেকর্ড করা হয়নি।</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto">
              {history.slice(0, 7).map((h) => (
                <div key={h.date} className="py-2 flex items-center justify-between text-xs tabular-nums">
                  <span className="text-slate-600 dark:text-slate-300">{toBengaliDigits(h.date)}</span>
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#10182B] dark:text-white">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    {toBengaliDigits(h.totalCount)} জিকির
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 p-5 space-y-4">
            <h3 className="text-base font-bold text-[#10182B] dark:text-white">তাসবিহ রিসেট নিশ্চিত করুন</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              আপনি কি “{activeSession.titleBn}” কাউন্টারটি শূন্যে (০) ফিরিয়ে নিতে চান?
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmReset(false)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 text-xs font-semibold"
              >
                বাতিল
              </button>
              <button
                onClick={handleReset}
                className="flex-1 rounded-xl bg-[#D92735] py-2.5 text-xs font-semibold text-white"
              >
                হ্যাঁ, রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
