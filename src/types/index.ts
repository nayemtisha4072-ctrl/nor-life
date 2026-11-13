export type AppLanguage = 'bn' | 'en';
export type AppTheme = 'light' | 'dark' | 'system';
export type AppTab = 'home' | 'quran' | 'namaz' | 'tools' | 'profile';

export type CalculationMethodKey =
  | 'Karachi'
  | 'MuslimWorldLeague'
  | 'UmmAlQura'
  | 'Egyptian'
  | 'NorthAmerica'
  | 'Singapore'
  | 'Tehran';

export type MadhabKey = 'hanafi' | 'shafi';

export interface CityLocation {
  id: string;
  nameBn: string;
  nameEn: string;
  countryBn: string;
  countryEn: string;
  latitude: number;
  longitude: number;
  timezone: string;
  isGPS?: boolean;
}

export interface PrayerNotificationSetting {
  enabled: boolean;
  sound: 'adhan' | 'chime' | 'silent';
  vibrate: boolean;
}

export interface AppSettings {
  language: AppLanguage;
  theme: AppTheme;
  location: CityLocation;
  calculationMethod: CalculationMethodKey;
  madhab: MadhabKey;
  hijriAdjustment: number; // -2 to +2 days for local moon sighting
  arabicFontSize: number; // px
  bengaliFontSize: number; // px
  showPronunciation: boolean;
  showEnglishTranslation: boolean;
  quranReadingTheme: 'default' | 'sepia' | 'night';
  reciter: string;
  userName: string;
  notifications: {
    fajr: PrayerNotificationSetting;
    dhuhr: PrayerNotificationSetting;
    asr: PrayerNotificationSetting;
    maghrib: PrayerNotificationSetting;
    isha: PrayerNotificationSetting;
  };
}

export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: 'Meccan' | 'Medinan';
  bengaliName: string;
  bengaliMeaning: string;
}

export interface AyahItem {
  number: number;
  numberInSurah: number;
  arabic: string;
  bengali: string;
  english: string;
  audio: string;
  juz?: number;
  page?: number;
  sajda?: boolean;
  surahNumber?: number;
  surahNameAr?: string;
  surahNameEn?: string;
}

export interface SurahDetail {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  revelationType: string;
  numberOfAyahs: number;
  reciter: string;
  ayahs: AyahItem[];
}

export interface BookmarkItem {
  id: string;
  type: 'ayah' | 'dua' | 'name' | 'hadith' | 'article';
  titleBn: string;
  titleEn?: string;
  subtitleBn?: string;
  arabic?: string;
  refData: Record<string, string | number>;
  createdAt: number;
}

export interface PersonalNote {
  id: string;
  title: string;
  content: string;
  reference?: string;
  updatedAt: number;
}

export interface TasbihSession {
  id: string;
  titleBn: string;
  arabic: string;
  pronunciation: string;
  meaningBn: string;
  count: number;
  target: number;
}

export interface TasbihHistoryEntry {
  date: string; // YYYY-MM-DD
  totalCount: number;
  sessionsCompleted: number;
}
