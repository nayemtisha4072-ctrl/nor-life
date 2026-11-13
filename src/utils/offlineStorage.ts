import {
  AppSettings,
  BookmarkItem,
  PersonalNote,
  SurahDetail,
  SurahMeta,
  TasbihHistoryEntry,
  TasbihSession,
} from '../types';
import { DEFAULT_BANGLADESH_CITY } from '../data/bangladeshCities';

const SETTINGS_KEY = 'noorlife_settings_v1';
const BOOKMARKS_KEY = 'noorlife_bookmarks_v1';
const NOTES_KEY = 'noorlife_notes_v1';
const TASBIH_SESSIONS_KEY = 'noorlife_tasbih_sessions_v1';
const TASBIH_HISTORY_KEY = 'noorlife_tasbih_history_v1';
const FASTING_TRACKER_KEY = 'noorlife_fasting_tracker_v1';
const LAST_READ_KEY = 'noorlife_last_read_v1';
const RECENT_ITEMS_KEY = 'noorlife_recent_v1';
const DAILY_PRAYER_TRACKER_KEY = 'noorlife_prayer_tracker_v1';

export const DEFAULT_SETTINGS: AppSettings = {
  language: 'bn',
  theme: 'light',
  location: DEFAULT_BANGLADESH_CITY,
  calculationMethod: 'Karachi',
  madhab: 'hanafi',
  hijriAdjustment: 0,
  arabicFontSize: 28,
  bengaliFontSize: 16,
  showPronunciation: true,
  showEnglishTranslation: false,
  quranReadingTheme: 'default',
  reciter: 'ar.alafasy',
  userName: 'মুসলিম ভাই/বোন',
  notifications: {
    fajr: { enabled: true, sound: 'adhan', vibrate: true },
    dhuhr: { enabled: true, sound: 'chime', vibrate: true },
    asr: { enabled: true, sound: 'chime', vibrate: true },
    maghrib: { enabled: true, sound: 'adhan', vibrate: true },
    isha: { enabled: true, sound: 'chime', vibrate: true },
  },
};

export const DEFAULT_TASBIH_SESSIONS: TasbihSession[] = [
  {
    id: 'subhanallah',
    titleBn: 'সুবহানাল্লাহ',
    arabic: 'سُبْحَانَ اللَّهِ',
    pronunciation: 'সুবহানাল্লাহ',
    meaningBn: 'আল্লাহ পবিত্র ও মহান',
    count: 0,
    target: 33,
  },
  {
    id: 'alhamdulillah',
    titleBn: 'আলহামদুলিল্লাহ',
    arabic: 'الْحَمْدُ لِلَّهِ',
    pronunciation: 'আলহামদুলিল্লাহ',
    meaningBn: 'সকল প্রশংসা আল্লাহর জন্য',
    count: 0,
    target: 33,
  },
  {
    id: 'allahuakbar',
    titleBn: 'আল্লাহু আকবার',
    arabic: 'اللَّهُ أَكْبَرُ',
    pronunciation: 'আল্লাহু আকবার',
    meaningBn: 'আল্লাহ সর্বশ্রেষ্ঠ',
    count: 0,
    target: 34,
  },
  {
    id: 'astaghfirullah',
    titleBn: 'আস্তাগফিরুল্লাহ',
    arabic: 'أَسْتَغْفِرُ اللَّهَ',
    pronunciation: 'আস্তাগফিরুল্লাহ',
    meaningBn: 'আমি আল্লাহর নিকট ক্ষমা প্রার্থনা করছি',
    count: 0,
    target: 100,
  },
  {
    id: 'durood',
    titleBn: 'দরুদ শরিফ',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ',
    pronunciation: 'আল্লাহুম্মা সাল্লি আলা মুহাম্মাদিও ওয়া আলা আলি মুহাম্মাদ',
    meaningBn: 'হে আল্লাহ, মুহাম্মদ (সা.) ও তাঁর বংশধরের উপর রহমত বর্ষণ করুন',
    count: 0,
    target: 100,
  },
  {
    id: 'tawheed',
    titleBn: 'লা ইলাহা ইল্লাল্লাহ',
    arabic: 'لَا إِلَهَ إِلَّا اللَّهُ',
    pronunciation: 'লা ইলাহা ইল্লাল্লাহ',
    meaningBn: 'আল্লাহ ছাড়া কোনো উপাস্য নেই',
    count: 0,
    target: 100,
  },
];

function safeParse<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSave(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota exceeded
  }
}

export const storage = {
  getSettings: (): AppSettings => ({
    ...DEFAULT_SETTINGS,
    ...safeParse<Partial<AppSettings>>(SETTINGS_KEY, {}),
  }),
  saveSettings: (s: AppSettings) => safeSave(SETTINGS_KEY, s),

  getBookmarks: (): BookmarkItem[] => safeParse<BookmarkItem[]>(BOOKMARKS_KEY, []),
  saveBookmarks: (b: BookmarkItem[]) => safeSave(BOOKMARKS_KEY, b),

  getNotes: (): PersonalNote[] => safeParse<PersonalNote[]>(NOTES_KEY, []),
  saveNotes: (n: PersonalNote[]) => safeSave(NOTES_KEY, n),

  getTasbihSessions: (): TasbihSession[] =>
    safeParse<TasbihSession[]>(TASBIH_SESSIONS_KEY, DEFAULT_TASBIH_SESSIONS),
  saveTasbihSessions: (s: TasbihSession[]) => safeSave(TASBIH_SESSIONS_KEY, s),

  getTasbihHistory: (): TasbihHistoryEntry[] =>
    safeParse<TasbihHistoryEntry[]>(TASBIH_HISTORY_KEY, []),
  saveTasbihHistory: (h: TasbihHistoryEntry[]) => safeSave(TASBIH_HISTORY_KEY, h),

  getFastingTracker: (): Record<string, boolean> =>
    safeParse<Record<string, boolean>>(FASTING_TRACKER_KEY, {}),
  saveFastingTracker: (f: Record<string, boolean>) => safeSave(FASTING_TRACKER_KEY, f),

  getDailyPrayerTracker: (): Record<string, Record<string, boolean>> =>
    safeParse<Record<string, Record<string, boolean>>>(DAILY_PRAYER_TRACKER_KEY, {}),
  saveDailyPrayerTracker: (p: Record<string, Record<string, boolean>>) =>
    safeSave(DAILY_PRAYER_TRACKER_KEY, p),

  getLastRead: (): { surahNumber: number; surahName: string; ayahNumber: number; timestamp: number } | null =>
    safeParse(LAST_READ_KEY, null),
  saveLastRead: (data: { surahNumber: number; surahName: string; ayahNumber: number; timestamp: number }) =>
    safeSave(LAST_READ_KEY, data),

  getRecentItems: (): Array<{ id: string; title: string; module: string; timestamp: number }> =>
    safeParse(RECENT_ITEMS_KEY, []),
  addRecentItem: (item: { id: string; title: string; module: string }) => {
    const existing = storage.getRecentItems().filter((i) => i.id !== item.id);
    const updated = [{ ...item, timestamp: Date.now() }, ...existing].slice(0, 12);
    safeSave(RECENT_ITEMS_KEY, updated);
    return updated;
  },
};

// IndexedDB for offline Quran Surahs, Audio blobs, and Hadith packs
const DB_NAME = 'noorlife_offline_db';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB not supported'));
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('surahs')) db.createObjectStore('surahs', { keyPath: 'number' });
      if (!db.objectStoreNames.contains('surahMeta')) db.createObjectStore('surahMeta', { keyPath: 'key' });
      if (!db.objectStoreNames.contains('audio')) db.createObjectStore('audio', { keyPath: 'url' });
      if (!db.objectStoreNames.contains('hadith')) db.createObjectStore('hadith', { keyPath: 'book' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const offlineDB = {
  async saveSurahList(list: SurahMeta[]) {
    try {
      const db = await openDB();
      const tx = db.transaction('surahMeta', 'readwrite');
      tx.objectStore('surahMeta').put({ key: 'all', data: list });
    } catch {
      // ignore
    }
  },
  async getSurahList(): Promise<SurahMeta[] | null> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('surahMeta', 'readonly');
        const req = tx.objectStore('surahMeta').get('all');
        req.onsuccess = () => resolve(req.result?.data ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async saveSurah(surah: SurahDetail) {
    try {
      const db = await openDB();
      const tx = db.transaction('surahs', 'readwrite');
      tx.objectStore('surahs').put(surah);
    } catch {
      // ignore
    }
  },
  async getSurah(number: number): Promise<SurahDetail | null> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('surahs', 'readonly');
        const req = tx.objectStore('surahs').get(number);
        req.onsuccess = () => resolve(req.result ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async getCachedSurahNumbers(): Promise<number[]> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('surahs', 'readonly');
        const req = tx.objectStore('surahs').getAllKeys();
        req.onsuccess = () => resolve((req.result as number[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  },
  async saveAudioBlob(url: string, blob: Blob) {
    try {
      const db = await openDB();
      const tx = db.transaction('audio', 'readwrite');
      tx.objectStore('audio').put({ url, blob, savedAt: Date.now() });
    } catch {
      // ignore
    }
  },
  async getAudioBlob(url: string): Promise<Blob | null> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('audio', 'readonly');
        const req = tx.objectStore('audio').get(url);
        req.onsuccess = () => resolve(req.result?.blob ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async getAudioCount(): Promise<number> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('audio', 'readonly');
        const req = tx.objectStore('audio').count();
        req.onsuccess = () => resolve(req.result || 0);
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  },
  async saveHadithBook(book: string, items: unknown[]) {
    try {
      const db = await openDB();
      const tx = db.transaction('hadith', 'readwrite');
      tx.objectStore('hadith').put({ book, items, savedAt: Date.now() });
    } catch {
      // ignore
    }
  },
  async getHadithBook(book: string): Promise<unknown[] | null> {
    try {
      const db = await openDB();
      return await new Promise((resolve) => {
        const tx = db.transaction('hadith', 'readonly');
        const req = tx.objectStore('hadith').get(book);
        req.onsuccess = () => resolve(req.result?.items ?? null);
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },
  async clearAllOfflineCaches() {
    try {
      const db = await openDB();
      const stores = ['surahs', 'surahMeta', 'audio', 'hadith'];
      const tx = db.transaction(stores, 'readwrite');
      for (const s of stores) tx.objectStore(s).clear();
    } catch {
      // ignore
    }
  },
};
