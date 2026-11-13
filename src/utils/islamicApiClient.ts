import { SurahDetail } from '../types';

function isNativeCapacitor(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  return window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' && window.location.port === '';
}

async function fetchJson(url: string, timeoutMs = 14000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

export const islamicApi = {
  async getSurahs() {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch('/api/quran/surahs');
        if (res.ok) return await res.json();
      } catch {
        // fallback to direct HTTPS API
      }
    }
    const json = await fetchJson('https://api.alquran.cloud/v1/surah');
    if (json?.code !== 200 || !Array.isArray(json?.data)) throw new Error('Surah list error');
    return json.data;
  },

  async getSurah(surahNumber: number, reciter: string): Promise<SurahDetail> {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/quran/surah/${surahNumber}?reciter=${encodeURIComponent(reciter)}`);
        if (res.ok) {
          const d = await res.json();
          if (!d.error) return d;
        }
      } catch {
        // fallback to direct HTTPS API
      }
    }
    const safeReciter = reciter || 'ar.alafasy';
    const json = await fetchJson(
      `https://api.alquran.cloud/v1/surah/${surahNumber}/editions/quran-uthmani,bn.bengali,en.sahih,${safeReciter}`
    );
    if (json?.code !== 200 || !Array.isArray(json?.data) || json.data.length < 4) {
      throw new Error('সূরা লোড করা যায়নি');
    }
    const [arabicEd, bengaliEd, englishEd, audioEd] = json.data;
    return {
      number: arabicEd.number,
      name: arabicEd.name,
      englishName: arabicEd.englishName,
      englishNameTranslation: arabicEd.englishNameTranslation,
      revelationType: arabicEd.revelationType,
      numberOfAyahs: arabicEd.numberOfAyahs,
      reciter: safeReciter,
      ayahs: arabicEd.ayahs.map((a: { number: number; numberInSurah: number; text: string; juz: number; page: number; sajda: boolean | object }, idx: number) => ({
        number: a.number,
        numberInSurah: a.numberInSurah,
        arabic: a.text,
        bengali: bengaliEd.ayahs[idx]?.text ?? '',
        english: englishEd.ayahs[idx]?.text ?? '',
        audio: audioEd.ayahs[idx]?.audio ?? '',
        juz: a.juz,
        page: a.page,
        sajda: Boolean(a.sajda),
      })),
    };
  },

  async getJuz(juz: number) {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/quran/juz/${juz}`);
        if (res.ok) {
          const d = await res.json();
          if (!d.error) return d;
        }
      } catch {
        // fallback
      }
    }
    const [arJson, bnJson, enJson] = await Promise.all([
      fetchJson(`https://api.alquran.cloud/v1/juz/${juz}/quran-uthmani`),
      fetchJson(`https://api.alquran.cloud/v1/juz/${juz}/bn.bengali`),
      fetchJson(`https://api.alquran.cloud/v1/juz/${juz}/en.sahih`),
    ]);
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
    return { juz, totalAyahs: ayahs.length, ayahs };
  },

  async getTafsir(surah: number, ayah: number): Promise<{ source: string; text: string }> {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/quran/tafsir/${surah}/${ayah}`);
        if (res.ok) {
          const d = await res.json();
          if (!d.error && d.text) return d;
        }
      } catch {
        // fallback
      }
    }
    const sources = [
      { id: 166, name: 'তাফসীর আবু বকর যাকারিয়া (কুরআন.কম)' },
      { id: 165, name: 'তাফসীর আহসানুল বায়ান (কুরআন.কম)' },
      { id: 164, name: 'তাফসীর ইবনে কাসীর বাংলা (কুরআন.কম)' },
    ];
    for (const s of sources) {
      try {
        const json = await fetchJson(`https://api.quran.com/api/v4/tafsirs/${s.id}/by_ayah/${surah}:${ayah}`);
        const raw = json?.tafsir?.text;
        if (raw && typeof raw === 'string') {
          return {
            source: json?.tafsir?.resource_name || s.name,
            text: raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
          };
        }
      } catch {
        // try next
      }
    }
    throw new Error('তাফসীর লোড করা যায়নি');
  },

  async searchQuran(q: string) {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/quran/search?q=${encodeURIComponent(q)}`);
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }
    const json = await fetchJson(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/bn.bengali`);
    const matches = Array.isArray(json?.data?.matches)
      ? json.data.matches.slice(0, 30).map((m: { number: number; text: string; numberInSurah: number; surah: { number: number; name: string; englishName: string } }) => ({
          number: m.number,
          numberInSurah: m.numberInSurah,
          text: m.text,
          surahNumber: m.surah.number,
          surahName: m.surah.name,
          surahEnglishName: m.surah.englishName,
        }))
      : [];
    return { count: matches.length, matches };
  },

  async getHadith(book: 'bukhari' | 'muslim' | 'tirmidhi' | 'abudawud', page: number, limit: number, q: string) {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/hadith/${book}?page=${page}&limit=${limit}&q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const d = await res.json();
          if (!d.error) return d;
        }
      } catch {
        // fallback
      }
    }
    const metaMap = {
      bukhari: { url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-bukhari.json', bn: 'সহীহ বুখারী', en: 'Sahih al-Bukhari' },
      muslim: { url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-muslim.json', bn: 'সহীহ মুসলিম', en: 'Sahih Muslim' },
      tirmidhi: { url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-tirmidhi.json', bn: 'জামে আত-তিরমিযী', en: 'Jami at-Tirmidhi' },
      abudawud: { url: 'https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ben-abudawud.json', bn: 'সুনানে আবু দাউদ', en: 'Sunan Abi Dawud' },
    }[book];

    const json = await fetchJson(metaMap.url, 20000);
    const all = (json.hadiths || []).filter((h: { text?: string }) => h.text && h.text.trim().length > 0);
    const filtered = q ? all.filter((h: { text: string; hadithnumber: number }) => h.text.includes(q) || String(h.hadithnumber) === q) : all;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((h: { hadithnumber: number; text: string; grades?: Array<{ grade: string }>; reference?: { book: number; hadith: number } }) => ({
      hadithNumber: h.hadithnumber,
      text: h.text.trim(),
      bookBn: metaMap.bn,
      bookEn: metaMap.en,
      reference: h.reference ? `অধ্যায় ${h.reference.book}, হাদিস ${h.reference.hadith}` : `হাদিস নং ${h.hadithnumber}`,
      grade: h.grades?.[0]?.grade || 'সহীহ/যাচাইকৃত সংকলন',
    }));
    return {
      book,
      bookBn: metaMap.bn,
      bookEn: metaMap.en,
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit),
      items,
    };
  },

  async reverseGeocode(lat: number, lon: number) {
    if (!isNativeCapacitor()) {
      try {
        const res = await fetch(`/api/geocode/reverse?lat=${lat}&lon=${lon}`);
        if (res.ok) return await res.json();
      } catch {
        // fallback
      }
    }
    const json = await fetchJson(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=bn`,
      8000
    );
    return {
      city: json?.city || json?.locality || json?.principalSubdivision || 'বর্তমান অবস্থান',
      country: json?.countryName || 'বাংলাদেশ',
      lat,
      lon,
    };
  },
};
