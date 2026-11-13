import React, { useEffect, useState } from 'react';
import { AlertTriangle, Compass, Info, MapPin, Navigation } from 'lucide-react';
import { useAppStore } from '../../hooks/useAppStore';
import { computeDistanceToKaabaKm, computeQiblaBearing } from '../../utils/prayerEngine';
import { toBengaliDigits } from '../../utils/bengaliDigits';

interface Props {
  onOpenLocationModal: () => void;
}

export const QiblaCompassTool: React.FC<Props> = ({ onOpenLocationModal }) => {
  const { settings, t } = useAppStore();
  const [heading, setHeading] = useState<number | null>(null);
  const [sensorStatus, setSensorStatus] = useState<'checking' | 'active' | 'permission_needed' | 'unavailable'>('checking');
  const [interferenceWarning, setInterferenceWarning] = useState(false);

  const qiblaBearing = computeQiblaBearing(
    settings.location.latitude,
    settings.location.longitude
  );
  const distanceKm = computeDistanceToKaabaKm(
    settings.location.latitude,
    settings.location.longitude
  );

  useEffect(() => {
    let receivedData = false;
    let prevAlpha: number | null = null;
    let jumpCount = 0;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
      let compassHeading: number | null = null;

      if (typeof ev.webkitCompassHeading === 'number') {
        compassHeading = ev.webkitCompassHeading;
        if (typeof ev.webkitCompassAccuracy === 'number' && ev.webkitCompassAccuracy > 25) {
          setInterferenceWarning(true);
        } else {
          setInterferenceWarning(false);
        }
      } else if (typeof ev.alpha === 'number' && ev.absolute !== false) {
        compassHeading = (360 - ev.alpha) % 360;
      } else if (typeof ev.alpha === 'number') {
        compassHeading = (360 - ev.alpha) % 360;
      }

      if (compassHeading !== null && Number.isFinite(compassHeading)) {
        receivedData = true;
        if (prevAlpha !== null && Math.abs(compassHeading - prevAlpha) > 45 && Math.abs(compassHeading - prevAlpha) < 315) {
          jumpCount += 1;
          if (jumpCount > 4) setInterferenceWarning(true);
        } else {
          jumpCount = Math.max(0, jumpCount - 1);
        }
        prevAlpha = compassHeading;
        setHeading(compassHeading);
        setSensorStatus('active');
      }
    };

    const devOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof window.DeviceOrientationEvent === 'undefined') {
      setSensorStatus('unavailable');
      return;
    }

    if (typeof devOrient?.requestPermission === 'function') {
      setSensorStatus('permission_needed');
      return;
    }

    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
    window.addEventListener('deviceorientation', handleOrientation, true);

    const fallbackTimer = setTimeout(() => {
      if (!receivedData) {
        setSensorStatus('unavailable');
      }
    }, 1800);

    return () => {
      clearTimeout(fallbackTimer);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener, true);
      window.removeEventListener('deviceorientation', handleOrientation, true);
    };
  }, []);

  const requestIOSCompass = async () => {
    const devOrient = window.DeviceOrientationEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof devOrient?.requestPermission !== 'function') return;
    try {
      const res = await devOrient.requestPermission();
      if (res === 'granted') {
        setSensorStatus('checking');
        window.addEventListener(
          'deviceorientation',
          (e: DeviceOrientationEvent) => {
            const ev = e as DeviceOrientationEvent & { webkitCompassHeading?: number };
            if (typeof ev.webkitCompassHeading === 'number') {
              setHeading(ev.webkitCompassHeading);
              setSensorStatus('active');
            }
          },
          true
        );
      } else {
        setSensorStatus('unavailable');
      }
    } catch {
      setSensorStatus('unavailable');
    }
  };

  // Relative angle to Kaaba when live compass is active; otherwise static true-North bearing
  const needleRotation = heading !== null ? (qiblaBearing - heading + 360) % 360 : qiblaBearing;
  const isAligned = heading !== null && (needleRotation < 6 || needleRotation > 354);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-6 flex flex-col items-center text-center">
        <div className="w-full flex items-center justify-between gap-3 mb-4">
          <div className="text-left">
            <h2 className="text-lg font-bold text-[#10182B] dark:text-white">
              {t('কিবলা কম্পাস ও দিকনির্দেশ', 'Qibla Compass & Bearing')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {settings.location.nameBn} · কাবা শরীফ থেকে {toBengaliDigits(distanceKm.toLocaleString())} কি.মি.
            </p>
          </div>
          <button
            onClick={onOpenLocationModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2457D6]/10 text-[#2457D6] dark:text-[#60A5FA] px-3 py-2 text-xs font-semibold"
          >
            <MapPin className="w-3.5 h-3.5" />
            {t('অবস্থান', 'Location')}
          </button>
        </div>

        {sensorStatus === 'permission_needed' && (
          <button
            onClick={requestIOSCompass}
            className="mb-4 rounded-xl bg-[#2457D6] px-4 py-2.5 text-xs font-semibold text-white"
          >
            {t('লাইভ কম্পাস সেন্সর চালু করুন', 'Enable Live Compass Sensor')}
          </button>
        )}

        {interferenceWarning && (
          <div className="w-full mb-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700 px-3.5 py-2.5 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>চৌম্বকীয় হস্তক্ষেপ শনাক্ত হয়েছে! ধাতব বস্তু বা চুম্বক থেকে দূরে সরে ফোনটি '৮' আকৃতিতে ঘোরান।</span>
          </div>
        )}

        {/* Compass Dial */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 my-4 flex items-center justify-center">
          <div
            className={`w-full h-full rounded-full border-4 transition-colors flex items-center justify-center relative ${
              isAligned
                ? 'border-emerald-500 bg-emerald-500/5'
                : 'border-[#2457D6]/30 bg-[#F7F9FF] dark:bg-[#10182B]'
            }`}
          >
            {/* Cardinal Labels (rotated by -heading if live compass active) */}
            <div
              className="absolute inset-3 rounded-full transition-transform duration-150"
              style={{ transform: `rotate(${heading !== null ? -heading : 0}deg)` }}
            >
              <span className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-[#D92735]">উ (N)</span>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-xs font-bold text-slate-400">দ (S)</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">পূ (E)</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">প (W)</span>
            </div>

            {/* Qibla Needle */}
            <div
              className="absolute inset-0 flex items-center justify-center transition-transform duration-150"
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <div className="flex flex-col items-center -translate-y-10">
                <div className="w-7 h-7 rounded-lg bg-[#10182B] dark:bg-white border-2 border-[#D92735] flex items-center justify-center shadow-md">
                  <div className="w-3 h-3 bg-amber-400 rounded-xs" />
                </div>
                <div className="w-1.5 h-16 bg-gradient-to-b from-[#D92735] to-[#2457D6] rounded-full mt-1" />
              </div>
            </div>

            <div className="w-12 h-12 rounded-full bg-white dark:bg-[#19243A] border-2 border-[#2457D6] flex items-center justify-center shadow-sm z-10">
              <Compass className="w-5 h-5 text-[#2457D6]" />
            </div>
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <p className="text-2xl font-bold tabular-nums text-[#2457D6] dark:text-[#60A5FA]">
            {toBengaliDigits(qiblaBearing.toFixed(1))}° (উত্তর থেকে)
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {sensorStatus === 'active'
              ? isAligned
                ? 'আপনি সঠিকভাবে কিবলামুখী রয়েছেন!'
                : 'ফোনটি সমতলে ধরে তীর চিহ্ন বরাবর ঘোরান'
              : 'লাইভ ম্যাগনেটোমিটার সেন্সর পাওয়া যায়নি — সঠিক উত্তর দিক সাপেক্ষে কাবার কৌণিক দিক প্রদর্শিত হচ্ছে।'}
          </p>
        </div>
      </div>

      {/* Fallback & Calibration Instructions */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-3">
          <div className="flex items-center gap-2 text-[#2457D6] dark:text-[#60A5FA]">
            <Navigation className="w-4 h-4" />
            <h3 className="text-sm font-bold">ভৌগোলিক হিসাব ও কৌণিক নির্দেশনা</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm tabular-nums">
            <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">কিবলা কোণ (Bearing)</p>
              <p className="text-base font-bold text-[#10182B] dark:text-white mt-0.5">
                {toBengaliDigits(qiblaBearing.toFixed(2))}°
              </p>
            </div>
            <div className="rounded-xl bg-[#F7F9FF] dark:bg-[#10182B] p-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">কাবা শরীফের দূরত্ব</p>
              <p className="text-base font-bold text-[#10182B] dark:text-white mt-0.5">
                {toBengaliDigits(distanceKm.toLocaleString())} কি.মি.
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            বাংলাদেশের প্রায় সকল জেলা থেকে কাবা শরীফের দিক <strong>পশ্চিম-উত্তর-পশ্চিম (প্রায় ২৭৭°–২৭৮°)</strong> বরাবর। আপনার ডিভাইসে কম্পাস সেন্সর না থাকলে সূর্যোদয় (পূর্ব) ও সূর্যাস্ত (পশ্চিম) দেখে বা মানচিত্রের উত্তর দিক মিলিয়ে প্রায় {toBengaliDigits(Math.round(qiblaBearing))}° কোণে মুখ করুন।
          </p>
        </div>

        <div className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 space-y-2.5">
          <div className="flex items-center gap-2 text-[#D92735]">
            <Info className="w-4 h-4" />
            <h3 className="text-sm font-bold">কম্পাস ক্যালিব্রেশন নির্দেশনা</h3>
          </div>
          <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
            <li>ফোনটি মাটির সমান্তরালে সোজা ধরে রাখুন।</li>
            <li>চুম্বকযুক্ত ফোনের কভার, স্পিকার বা লোহার টেবিল থেকে দূরে থাকুন।</li>
            <li>সঠিক দিক পেতে ফোনটিকে বাতাসে ২–৩ বার ইংরেজি '৮' (Figure-8) আকৃতিতে ঘোরান।</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
