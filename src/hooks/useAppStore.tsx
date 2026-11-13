import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  AppSettings,
  AppTab,
  BookmarkItem,
  CityLocation,
  PersonalNote,
} from '../types';
import { storage } from '../utils/offlineStorage';

interface ToastMessage {
  id: number;
  text: string;
  tone?: 'info' | 'success' | 'error';
}

interface AppContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  setLocation: (loc: CityLocation) => void;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  activeToolId: string | null;
  setActiveToolId: (id: string | null) => void;
  openQuranAtSurah: number | null;
  setOpenQuranAtSurah: (n: number | null) => void;
  bookmarks: BookmarkItem[];
  toggleBookmark: (item: Omit<BookmarkItem, 'createdAt'>) => void;
  isBookmarked: (id: string) => boolean;
  notes: PersonalNote[];
  saveNote: (note: Omit<PersonalNote, 'updatedAt'>) => void;
  deleteNote: (id: string) => void;
  recentItems: Array<{ id: string; title: string; module: string; timestamp: number }>;
  trackRecent: (id: string, title: string, module: string) => void;
  isOnline: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
  showToast: (text: string, tone?: 'info' | 'success' | 'error') => void;
  toasts: ToastMessage[];
  t: (bn: string, en: string) => string;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(() => storage.getSettings());
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [activeToolId, setActiveToolId] = useState<string | null>(null);
  const [openQuranAtSurah, setOpenQuranAtSurah] = useState<number | null>(null);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => storage.getBookmarks());
  const [notes, setNotes] = useState<PersonalNote[]>(() => storage.getNotes());
  const [recentItems, setRecentItems] = useState(() => storage.getRecentItems());
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  // Sync theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const shouldBeDark =
        settings.theme === 'dark' || (settings.theme === 'system' && prefersDark);
      root.classList.toggle('dark', shouldBeDark);
      const metaTheme = document.querySelector('meta[name="theme-color"]');
      if (metaTheme) {
        metaTheme.setAttribute('content', shouldBeDark ? '#10182B' : '#2457D6');
      }
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [settings.theme]);

  // Sync html lang attribute
  useEffect(() => {
    document.documentElement.lang = settings.language;
  }, [settings.language]);

  // Online / Offline listeners
  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const showToast = useCallback((text: string, tone: 'info' | 'success' | 'error' = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev.slice(-2), { id, text, tone }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      storage.saveSettings(next);
      return next;
    });
  }, []);

  const setLocation = useCallback(
    (loc: CityLocation) => {
      updateSettings({ location: loc });
    },
    [updateSettings]
  );

  const toggleBookmark = useCallback(
    (item: Omit<BookmarkItem, 'createdAt'>) => {
      setBookmarks((prev) => {
        const exists = prev.some((b) => b.id === item.id);
        const next = exists
          ? prev.filter((b) => b.id !== item.id)
          : [{ ...item, createdAt: Date.now() }, ...prev];
        storage.saveBookmarks(next);
        showToast(
          exists
            ? settings.language === 'bn'
              ? 'বুকমার্ক থেকে সরানো হয়েছে'
              : 'Removed from bookmarks'
            : settings.language === 'bn'
              ? 'বুকমার্কে সংরক্ষিত হয়েছে'
              : 'Saved to bookmarks',
          'success'
        );
        return next;
      });
    },
    [settings.language, showToast]
  );

  const isBookmarked = useCallback(
    (id: string) => bookmarks.some((b) => b.id === id),
    [bookmarks]
  );

  const saveNote = useCallback(
    (note: Omit<PersonalNote, 'updatedAt'>) => {
      setNotes((prev) => {
        const existingIdx = prev.findIndex((n) => n.id === note.id);
        const entry: PersonalNote = { ...note, updatedAt: Date.now() };
        const next =
          existingIdx >= 0
            ? prev.map((n, i) => (i === existingIdx ? entry : n))
            : [entry, ...prev];
        storage.saveNotes(next);
        return next;
      });
      showToast(settings.language === 'bn' ? 'নোট সংরক্ষিত হয়েছে' : 'Note saved', 'success');
    },
    [settings.language, showToast]
  );

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => {
      const next = prev.filter((n) => n.id !== id);
      storage.saveNotes(next);
      return next;
    });
  }, []);

  const trackRecent = useCallback((id: string, title: string, module: string) => {
    const updated = storage.addRecentItem({ id, title, module });
    setRecentItems(updated);
  }, []);

  const t = useCallback(
    (bn: string, en: string) => (settings.language === 'bn' ? bn : en),
    [settings.language]
  );

  return (
    <AppContext.Provider
      value={{
        settings,
        updateSettings,
        setLocation,
        activeTab,
        setActiveTab,
        activeToolId,
        setActiveToolId,
        openQuranAtSurah,
        setOpenQuranAtSurah,
        bookmarks,
        toggleBookmark,
        isBookmarked,
        notes,
        saveNote,
        deleteNote,
        recentItems,
        trackRecent,
        isOnline,
        isSearchOpen,
        setIsSearchOpen,
        showToast,
        toasts,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppStore must be used inside AppProvider');
  return ctx;
}
