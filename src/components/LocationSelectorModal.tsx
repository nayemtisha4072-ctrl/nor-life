import React, { useState } from 'react';
import { MapPin, Navigation, Search, X, Check } from 'lucide-react';
import { BANGLADESH_AND_WORLD_CITIES } from '../data/bangladeshCities';
import { useAppStore } from '../hooks/useAppStore';
import { islamicApi } from '../utils/islamicApiClient';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const LocationSelectorModal: React.FC<Props> = ({ open, onClose }) => {
  const { settings, setLocation, showToast, t } = useAppStore();
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);

  if (!open) return null;

  const filtered = BANGLADESH_AND_WORLD_CITIES.filter(
    (c) =>
      c.nameBn.includes(query.trim()) ||
      c.nameEn.toLowerCase().includes(query.trim().toLowerCase()) ||
      c.countryBn.includes(query.trim())
  );

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      showToast(t('আপনার ডিভাইসে GPS সমর্থিত নয়', 'GPS not supported on this device'), 'error');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const data = await islamicApi.reverseGeocode(latitude, longitude);
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka';
          setLocation({
            id: `gps_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
            nameBn: data.city || t('বর্তমান অবস্থান', 'Current Location'),
            nameEn: data.city || 'Current Location',
            countryBn: data.country || '',
            countryEn: data.country || '',
            latitude,
            longitude,
            timezone: tz,
            isGPS: true,
          });
          showToast(t('অবস্থান সফলভাবে নির্ণয় করা হয়েছে', 'Location detected successfully'), 'success');
          onClose();
        } catch {
          setLocation({
            id: `gps_${latitude.toFixed(2)}_${longitude.toFixed(2)}`,
            nameBn: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            nameEn: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
            countryBn: 'GPS',
            countryEn: 'GPS',
            latitude,
            longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Dhaka',
            isGPS: true,
          });
          onClose();
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        showToast(
          t('অবস্থানের অনুমতি পাওয়া যায়নি। তালিকা থেকে শহর বেছে নিন।', 'Location permission denied. Please choose manually.'),
          'error'
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700/70">
          <div>
            <h3 className="text-lg font-bold text-[#10182B] dark:text-white">
              {t('অবস্থান ও শহর নির্বাচন', 'Select Location & City')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('সঠিক নামাজ, সেহরি, ইফতার ও কিবলা হিসাবের জন্য', 'Used for accurate prayer, Sehri/Iftar & Qibla calculation')}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label={t('বন্ধ করুন', 'Close')}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3 border-b border-slate-100 dark:border-slate-800">
          <button
            onClick={handleDetectGPS}
            disabled={detecting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2457D6] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1E47B8] transition-colors disabled:opacity-60 min-h-[44px]"
          >
            <Navigation className="w-4 h-4" />
            {detecting
              ? t('GPS অবস্থান নির্ণয় হচ্ছে...', 'Detecting GPS location...')
              : t('স্বয়ংক্রিয় GPS অবস্থান ব্যবহার করুন', 'Use Automatic GPS Location')}
          </button>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
            {t(
              'গোপনীয়তা: আপনার অবস্থান শুধুমাত্র নামাজের সময় ও কিবলার দিক নির্ণয়ে ব্যবহৃত হয় এবং কোনো সার্ভারে সংরক্ষণ করা হয় না।',
              'Privacy: Your coordinates are used strictly for prayer & Qibla calculation and are never stored on servers.'
            )}
          </p>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('জেলা বা শহরের নাম লিখুন (যেমন: ঢাকা, সিলেট)...', 'Search district or city...')}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F7F9FF] dark:bg-[#10182B] pl-10 pr-4 py-2.5 text-sm text-[#10182B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2457D6]"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          {filtered.map((city) => {
            const active = settings.location.id === city.id;
            return (
              <button
                key={city.id}
                onClick={() => {
                  setLocation(city);
                  onClose();
                }}
                className="w-full flex items-center justify-between px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors min-h-[52px]"
              >
                <div className="flex items-center gap-3">
                  <MapPin className={`w-4 h-4 shrink-0 ${active ? 'text-[#D92735]' : 'text-slate-400'}`} />
                  <div>
                    <p className="text-sm font-semibold text-[#10182B] dark:text-white">
                      {settings.language === 'bn' ? city.nameBn : city.nameEn}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {settings.language === 'bn' ? city.countryBn : city.countryEn} · {city.latitude.toFixed(2)}°, {city.longitude.toFixed(2)}°
                    </p>
                  </div>
                </div>
                {active && <Check className="w-5 h-5 text-[#2457D6]" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
