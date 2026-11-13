import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  Madhab,
  Prayer,
  PrayerTimes,
  Qibla,
  SunnahTimes,
} from 'adhan';
import { CalculationMethodKey, MadhabKey } from '../types';

export interface ComputedPrayerSchedule {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  sunset: Date;
  middleOfTheNight: Date;
  lastThirdOfTheNight: Date; // Tahajjud start
  sehriEnd: Date; // Fajr time
  iftar: Date; // Maghrib time
  currentPrayer: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayer: 'fajr' | 'sunrise' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
  nextPrayerTime: Date;
  msRemaining: number;
}

function getCalculationParams(method: CalculationMethodKey, madhab: MadhabKey): CalculationParameters {
  let params: CalculationParameters;
  switch (method) {
    case 'MuslimWorldLeague':
      params = CalculationMethod.MuslimWorldLeague();
      break;
    case 'UmmAlQura':
      params = CalculationMethod.UmmAlQura();
      break;
    case 'Egyptian':
      params = CalculationMethod.Egyptian();
      break;
    case 'NorthAmerica':
      params = CalculationMethod.NorthAmerica();
      break;
    case 'Singapore':
      params = CalculationMethod.Singapore();
      break;
    case 'Tehran':
      params = CalculationMethod.Tehran();
      break;
    case 'Karachi':
    default:
      params = CalculationMethod.Karachi();
      break;
  }
  params.madhab = madhab === 'shafi' ? Madhab.Shafi : Madhab.Hanafi;
  return params;
}

export function computePrayerTimesForDate(
  lat: number,
  lon: number,
  date: Date,
  method: CalculationMethodKey = 'Karachi',
  madhab: MadhabKey = 'hanafi'
): ComputedPrayerSchedule {
  const coords = new Coordinates(lat, lon);
  const params = getCalculationParams(method, madhab);
  const pt = new PrayerTimes(coords, date, params);
  const sunnah = new SunnahTimes(pt);

  const now = date;
  const currentRaw = pt.currentPrayer(now);
  const nextRaw = pt.nextPrayer(now);

  const mapPrayer = (p: (typeof Prayer)[keyof typeof Prayer]): ComputedPrayerSchedule['currentPrayer'] => {
    switch (p) {
      case Prayer.Fajr:
        return 'fajr';
      case Prayer.Sunrise:
        return 'sunrise';
      case Prayer.Dhuhr:
        return 'dhuhr';
      case Prayer.Asr:
        return 'asr';
      case Prayer.Maghrib:
        return 'maghrib';
      case Prayer.Isha:
        return 'isha';
      default:
        return 'isha';
    }
  };

  let nextPrayer: ComputedPrayerSchedule['nextPrayer'] = 'fajr';
  let nextPrayerTime: Date;

  if (nextRaw === Prayer.None) {
    const tomorrow = new Date(now.getTime() + 86400000);
    const tomorrowPt = new PrayerTimes(coords, tomorrow, params);
    nextPrayer = 'fajr';
    nextPrayerTime = tomorrowPt.fajr;
  } else {
    nextPrayer = mapPrayer(nextRaw);
    nextPrayerTime = pt.timeForPrayer(nextRaw) || pt.fajr;
  }

  return {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    sunset: pt.maghrib,
    middleOfTheNight: sunnah.middleOfTheNight,
    lastThirdOfTheNight: sunnah.lastThirdOfTheNight,
    sehriEnd: pt.fajr,
    iftar: pt.maghrib,
    currentPrayer: currentRaw === Prayer.None ? 'isha' : mapPrayer(currentRaw),
    nextPrayer,
    nextPrayerTime,
    msRemaining: Math.max(0, nextPrayerTime.getTime() - now.getTime()),
  };
}

export function computeMonthlyPrayerTimes(
  lat: number,
  lon: number,
  startDate: Date,
  days: number,
  method: CalculationMethodKey,
  madhab: MadhabKey
) {
  const result = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate() + i, 12, 0, 0);
    const pt = computePrayerTimesForDate(lat, lon, d, method, madhab);
    result.push({ date: d, ...pt });
  }
  return result;
}

export function computeQiblaBearing(lat: number, lon: number): number {
  const coords = new Coordinates(lat, lon);
  return Qibla(coords);
}

export function computeDistanceToKaabaKm(lat: number, lon: number): number {
  const KAABA_LAT = 21.422487;
  const KAABA_LON = 39.826206;
  const R = 6371;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLon = ((KAABA_LON - lon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export const PRAYER_LABELS: Record<
  ComputedPrayerSchedule['currentPrayer'],
  { bn: string; en: string }
> = {
  fajr: { bn: 'ফজর', en: 'Fajr' },
  sunrise: { bn: 'সূর্যোদয়', en: 'Sunrise' },
  dhuhr: { bn: 'যোহর', en: 'Dhuhr' },
  asr: { bn: 'আসর', en: 'Asr' },
  maghrib: { bn: 'মাগরিব', en: 'Maghrib' },
  isha: { bn: 'এশা', en: 'Isha' },
};

export const CALCULATION_METHODS: Array<{
  key: CalculationMethodKey;
  bn: string;
  en: string;
}> = [
  { key: 'Karachi', bn: 'ইসলামিক ফাউন্ডেশন / করাচি (বাংলাদেশ)', en: 'Univ. of Islamic Sciences, Karachi (Bangladesh)' },
  { key: 'MuslimWorldLeague', bn: 'মুসলিম ওয়ার্ল্ড লিগ (MWL)', en: 'Muslim World League' },
  { key: 'UmmAlQura', bn: 'উম্মুল কুরা বিশ্ববিদ্যালয়, মক্কা', en: 'Umm al-Qura University, Makkah' },
  { key: 'Egyptian', bn: 'মিশরীয় জেনারেল অথরিটি', en: 'Egyptian General Authority' },
  { key: 'Singapore', bn: 'সিঙ্গাপুর (MUIS)', en: 'MUIS Singapore' },
  { key: 'NorthAmerica', bn: 'ইসনা (ISNA - উত্তর আমেরিকা)', en: 'ISNA North America' },
  { key: 'Tehran', bn: 'তেহরান ইনস্টিটিউট', en: 'Institute of Geophysics, Tehran' },
];
