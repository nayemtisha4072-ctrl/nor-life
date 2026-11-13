import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useAppStore } from '../hooks/useAppStore';

export const PWAInstallButton: React.FC<{ variant?: 'compact' | 'card' }> = ({ variant = 'card' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const { t } = useAppStore();
  const [showGuide, setShowGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      await install();
    } else {
      setShowGuide(true);
    }
  };

  return (
    <>
      {variant === 'compact' ? (
        <button
          onClick={handleAction}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2457D6] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1E47B8] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Download className="w-4 h-4" />
          {t('অ্যাপ ইনস্টল', 'Install App')}
        </button>
      ) : (
        <button
          onClick={handleAction}
          className="w-full flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#2457D6] to-[#1D44B8] p-4 text-left text-white shadow-sm hover:opacity-95 transition-opacity min-h-[56px]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                {t('নূর লাইফ অ্যাপ হিসেবে ইনস্টল করুন', 'Install NOOR LIFE as an App')}
              </p>
              <p className="text-xs text-blue-100 mt-0.5">
                {t('হোম স্ক্রিনে যুক্ত করুন এবং অফলাইনে ব্যবহার করুন', 'Add to home screen for fast offline access')}
              </p>
            </div>
          </div>
          <Download className="w-5 h-5 shrink-0" />
        </button>
      )}

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#19243A] p-6 border border-slate-200 dark:border-slate-700 shadow-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-[#10182B] dark:text-white">
                {t('হোম স্ক্রিনে অ্যাপ যুক্ত করুন', 'Add NOOR LIFE to Home Screen')}
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                aria-label={t('বন্ধ করুন', 'Close')}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {isIOS ? (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>১. Safari ব্রাউজারের নিচের <strong>Share (শেয়ার)</strong> আইকনে ট্যাপ করুন।</p>
                <p>২. নিচে স্ক্রল করে <strong>Add to Home Screen</strong> নির্বাচন করুন।</p>
                <p>৩. উপরের <strong>Add</strong> বোতামে ট্যাপ করলেই নূর লাইফ অ্যাপ হিসেবে ইনস্টল হয়ে যাবে।</p>
              </div>
            ) : (
              <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>১. আপনার ব্রাউজারের (Chrome / Edge) উপরের ডানদিকের মেনু (<strong>⋮</strong>) আইকনে ট্যাপ করুন।</p>
                <p>২. <strong>Install App</strong> অথবা <strong>Add to Home screen</strong> অপশনটি বেছে নিন।</p>
                <p>৩. এরপর অফলাইন ক্যাশসহ নূর লাইফ পূর্ণাঙ্গ অ্যাপের মতো চলবে।</p>
              </div>
            )}
            <button
              onClick={() => setShowGuide(false)}
              className="mt-5 w-full rounded-xl bg-[#2457D6] py-2.5 text-sm font-semibold text-white hover:bg-[#1E47B8] transition-colors"
            >
              {t('বুঝেছি', 'Got it')}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
