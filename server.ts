import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Simple in-memory TTL cache for external verified Islamic datasets
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const apiCache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = apiCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    apiCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCached<T>(key: string, data: T, ttlMs: number) {
  apiCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'NoorLifeIslamicApp/1.0',
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from upstream`);
    }
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

// 1. All 114 Surahs list
app.get('/api/quran/surahs', async (_req, res) => {
  const cacheKey = 'quran_surahs';
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const json = await fetchJsonWithTimeout('https://api.alquran.cloud/v1/surah');
    if (json?.code !== 200 || !Array.isArray(json?.data)) {
      throw new Error('Invalid response from AlQuran Cloud');
    }
    setCached(cacheKey, json.data, 1000 * 60 * 60 * 24);
    return res.json(json.data);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'কুরআনের সূরা তালিকা আনতে সমস্যা হয়েছে। আপনার অফলাইন ক্যাশ পরীক্ষা করা হচ্ছে।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 2. Single Surah with Arabic Uthmani, Bengali (Muhiuddin Khan), English (Sahih), and Audio (Alafasy / selectable)
app.get('/api/quran/surah/:number', async (req, res) => {
  const surahNum = Number(req.params.number);
  const reciter = typeof req.query.reciter === 'string' ? req.query.reciter : 'ar.alafasy';
  const allowedReciters = ['ar.alafasy', 'ar.abdurrahmaansudais', 'ar.abdulbasitmurattal', 'ar.husary', 'ar.minshawi'];
  const safeReciter = allowedReciters.includes(reciter) ? reciter : 'ar.alafasy';

  if (!Number.isInteger(surahNum) || surahNum < 1 || surahNum > 114) {
    return res.status(400).json({ error: true, message: 'অবৈধ সূরা নম্বর।' });
  }

  const cacheKey = `surah_${surahNum}_${safeReciter}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://api.alquran.cloud/v1/surah/${surahNum}/editions/quran-uthmani,bn.bengali,en.sahih,${safeReciter}`;
    const json = await fetchJsonWithTimeout(url, 15000);
    if (json?.code !== 200 || !Array.isArray(json?.data) || json.data.length < 4) {
      throw new Error('Incomplete Surah editions returned');
    }

    const [arabicEd, bengaliEd, englishEd, audioEd] = json.data;
    const ayahs = arabicEd.ayahs.map((ayah: { number: number; numberInSurah: number; text: string; juz: number; page: number; hizbQuarter: number; sajda: boolean | object }, idx: number) => ({
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      arabic: ayah.text,
      bengali: bengaliEd.ayahs[idx]?.text ?? '',
      english: englishEd.ayahs[idx]?.text ?? '',
      audio: audioEd.ayahs[idx]?.audio ?? '',
      juz: ayah.juz,
      page: ayah.page,
      sajda: Boolean(ayah.sajda),
    }));

    const payload = {
      number: arabicEd.number,
      name: arabicEd.name,
      englishName: arabicEd.englishName,
      englishNameTranslation: arabicEd.englishNameTranslation,
      revelationType: arabicEd.revelationType,
      numberOfAyahs: arabicEd.numberOfAyahs,
      reciter: safeReciter,
      ayahs,
    };

    setCached(cacheKey, payload, 1000 * 60 * 60 * 12);
    return res.json(payload);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'সূরা লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 3. Single Juz (1-30)
app.get('/api/quran/juz/:juz', async (req, res) => {
  const juz = Number(req.params.juz);
  if (!Number.isInteger(juz) || juz < 1 || juz > 30) {
    return res.status(400).json({ error: true, message: 'অবৈধ পারা (জুজ) নম্বর।' });
  }

  const cacheKey = `juz_${juz}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const [arJson, bnJson, enJson] = await Promise.all([
      fetchJsonWithTimeout(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`, 15000),
      fetchJsonWithTimeout(`https://api.alquran.cloud/v1/juz/${juz}/bn.bengali`, 15000),
      fetchJsonWithTimeout(`https://api.alquran.cloud/v1/juz/${juz}/en.sahih`, 15000),
    ]);

    if (arJson?.code !== 200 || bnJson?.code !== 200) {
      throw new Error('Failed to fetch Juz editions');
    }

    const ayahs = arJson.data.ayahs.map((ayah: { number: number; numberInSurah: number; text: string; surah: { number: number; name: string; englishName: string } }, idx: number) => ({
      number: ayah.number,
      numberInSurah: ayah.numberInSurah,
      surahNumber: ayah.surah.number,
      surahNameAr: ayah.surah.name,
      surahNameEn: ayah.surah.englishName,
      arabic: ayah.text,
      bengali: bnJson.data.ayahs[idx]?.text ?? '',
      english: enJson?.data?.ayahs?.[idx]?.text ?? '',
    }));

    const payload = { juz, totalAyahs: ayahs.length, ayahs };
    setCached(cacheKey, payload, 1000 * 60 * 60 * 12);
    return res.json(payload);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'পারা (জুজ) তথ্য আনতে সমস্যা হয়েছে।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 4. Verified Bengali Tafsir per Ayah (Quran.com API v4 - Tafsir Abu Bakr Zakaria / Fathul Majid / Ibn Kathir)
app.get('/api/quran/tafsir/:surah/:ayah', async (req, res) => {
  const surah = Number(req.params.surah);
  const ayah = Number(req.params.ayah);
  if (!Number.isInteger(surah) || surah < 1 || surah > 114 || !Number.isInteger(ayah) || ayah < 1) {
    return res.status(400).json({ error: true, message: 'অবৈধ সূরা বা আয়াত নম্বর।' });
  }

  const cacheKey = `tafsir_${surah}_${ayah}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  // Quran.com Bengali Tafsir IDs: 166 (Tafsir Abu Bakr Zakaria), 165 (Tafsir Ahsanul Bayaan), 164 (Tafsir Ibn Kathir Bn)
  const tafsirSources = [
    { id: 166, name: 'তাফসীর আবু বকর যাকারিয়া (কুরআন.কম)' },
    { id: 165, name: 'তাফসীর আহসানুল বায়ান (কুরআন.কম)' },
    { id: 164, name: 'তাফসীর ইবনে কাসীর বাংলা (কুরআন.কম)' },
  ];

  for (const src of tafsirSources) {
    try {
      const json = await fetchJsonWithTimeout(
        `https://api.quran.com/api/v4/tafsirs/${src.id}/by_ayah/${surah}:${ayah}`,
        10000
      );
      const rawText = json?.tafsir?.text;
      if (rawText && typeof rawText === 'string' && rawText.trim().length > 0) {
        const cleanText = rawText
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        const payload = {
          surah,
          ayah,
          source: json?.tafsir?.resource_name || src.name,
          text: cleanText,
        };
        setCached(cacheKey, payload, 1000 * 60 * 60 * 24);
        return res.json(payload);
      }
    } catch {
      // try next verified source
    }
  }

  return res.status(502).json({
    error: true,
    message: 'এই আয়াতের তাফসীর এই মুহূর্তে লোড করা যায়নি। ইন্টারনেট সংযোগ যাচাই করুন।',
  });
});

// 5. Quran Bengali Search
app.get('/api/quran/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q.length < 2) {
    return res.json({ count: 0, matches: [] });
  }

  const cacheKey = `qsearch_${q}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const json = await fetchJsonWithTimeout(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/bn.bengali`,
      12000
    );
    const matches = Array.isArray(json?.data?.matches)
      ? json.data.matches.slice(0, 40).map((m: { number: number; text: string; numberInSurah: number; surah: { number: number; name: string; englishName: string } }) => ({
          number: m.number,
          numberInSurah: m.numberInSurah,
          text: m.text,
          surahNumber: m.surah.number,
          surahName: m.surah.name,
          surahEnglishName: m.surah.englishName,
        }))
      : [];
    const payload = { count: matches.length, matches };
    setCached(cacheKey, payload, 1000 * 60 * 30);
    return res.json(payload);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'কুরআন অনুসন্ধান করা যায়নি।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 6. Verified Bengali Hadith API (Bukhari, Muslim, Abu Dawud, Tirmidhi)
interface HadithRaw {
  hadithnumber: number;
  arabicnumber?: number;
  text: string;
  grades?: Array<{ name: string; grade: string }>;
  reference?: { book: number; hadith: number };
}

const HADITH_BOOKS: Record<string, { url: string; bnTitle: string; enTitle: string }> = {
  bukhari: {
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-bukhari.json',
    bnTitle: 'সহীহ বুখারী',
    enTitle: 'Sahih al-Bukhari',
  },
  muslim: {
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-muslim.json',
    bnTitle: 'সহীহ মুসলিম',
    enTitle: 'Sahih Muslim',
  },
  tirmidhi: {
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-tirmidhi.json',
    bnTitle: 'জামে আত-তিরমিযী',
    enTitle: 'Jami at-Tirmidhi',
  },
  abudawud: {
    url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-abudawud.json',
    bnTitle: 'সুনানে আবু দাউদ',
    enTitle: 'Sunan Abi Dawud',
  },
};

app.get('/api/hadith/:book', async (req, res) => {
  const bookKey = req.params.book.toLowerCase();
  const bookMeta = HADITH_BOOKS[bookKey];
  if (!bookMeta) {
    return res.status(400).json({ error: true, message: 'অনির্ধারিত হাদিস গ্রন্থ।' });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(30, Math.max(5, Number(req.query.limit) || 15));
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  try {
    const cacheKey = `hadith_book_${bookKey}`;
    let hadiths = getCached<HadithRaw[]>(cacheKey);
    if (!hadiths) {
      const json = await fetchJsonWithTimeout(bookMeta.url, 20000);
      if (!Array.isArray(json?.hadiths)) {
        throw new Error('Invalid hadith dataset');
      }
      const parsed: HadithRaw[] = json.hadiths.filter(
        (h: HadithRaw) => Boolean(h.text && h.text.trim().length > 0)
      );
      hadiths = parsed;
      setCached(cacheKey, parsed, 1000 * 60 * 60 * 24);
    }

    const safeHadiths: HadithRaw[] = hadiths;
    const filtered = q
      ? safeHadiths.filter(
          (h) =>
            h.text.includes(q) ||
            String(h.hadithnumber) === q
        )
      : safeHadiths;

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((h) => ({
      hadithNumber: h.hadithnumber,
      text: h.text.trim(),
      bookBn: bookMeta.bnTitle,
      bookEn: bookMeta.enTitle,
      reference: h.reference ? `অধ্যায় ${h.reference.book}, হাদিস ${h.reference.hadith}` : `হাদিস নং ${h.hadithnumber}`,
      grade: h.grades?.[0]?.grade || 'সহীহ/যাচাইকৃত সংকলন',
    }));

    return res.json({
      book: bookKey,
      bookBn: bookMeta.bnTitle,
      bookEn: bookMeta.enTitle,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items,
    });
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'হাদিস সংকলন লোড করা যায়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 7. Aladhan Hijri-Gregorian Calendar with moon-sighting adjustment
app.get('/api/calendar/hijri', async (req, res) => {
  const month = Number(req.query.month) || new Date().getMonth() + 1;
  const year = Number(req.query.year) || new Date().getFullYear();
  const adjustment = Math.max(-2, Math.min(2, Number(req.query.adjustment) || 0));

  const cacheKey = `hijri_cal_${month}_${year}_${adjustment}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const url = `https://api.aladhan.com/v1/gToHCalendar/${month}/${year}?adjustment=${adjustment}`;
    const json = await fetchJsonWithTimeout(url, 10000);
    if (json?.code !== 200 || !Array.isArray(json?.data)) {
      throw new Error('Aladhan calendar error');
    }
    setCached(cacheKey, json.data, 1000 * 60 * 60 * 12);
    return res.json(json.data);
  } catch (err) {
    return res.status(502).json({
      error: true,
      message: 'হিজরি ক্যালেন্ডার অনলাইন থেকে আনা যায়নি।',
      detail: err instanceof Error ? err.message : 'Unknown error',
    });
  }
});

// 8. Reverse Geocoding for GPS Coordinates
app.get('/api/geocode/reverse', async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({ error: true, message: 'অবৈধ স্থানাঙ্ক।' });
  }

  const cacheKey = `revgeo_${lat.toFixed(2)}_${lon.toFixed(2)}`;
  const cached = getCached(cacheKey);
  if (cached) return res.json(cached);

  try {
    const json = await fetchJsonWithTimeout(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bn`,
      8000
    );
    const city = json?.city || json?.locality || json?.principalSubdivision || 'অজানা স্থান';
    const country = json?.countryName || 'বাংলাদেশ';
    const payload = { city, country, lat, lon };
    setCached(cacheKey, payload, 1000 * 60 * 60 * 24);
    return res.json(payload);
  } catch {
    return res.json({
      city: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
      country: '',
      lat,
      lon,
    });
  }
});

// Health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, app: 'NOOR LIFE', timestamp: new Date().toISOString() });
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`NOOR LIFE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
