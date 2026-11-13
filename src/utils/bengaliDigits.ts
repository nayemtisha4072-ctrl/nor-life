const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => BN_DIGITS[Number(d)] ?? d);
}

export function formatTimeBn(date: Date, timeZone?: string, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const formatted = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone || 'Asia/Dhaka',
    }).format(date);
    return lang === 'bn' ? toBengaliDigits(formatted) : formatted;
  } catch {
    const h = date.getHours();
    const m = String(date.getMinutes()).padStart(2, '0');
    const period = h >= 12 ? (lang === 'bn' ? 'PM' : 'PM') : 'AM';
    const hour12 = String(h % 12 || 12).padStart(2, '0');
    const str = `${hour12}:${m} ${period}`;
    return lang === 'bn' ? toBengaliDigits(str) : str;
  }
}

export function formatGregorianDateBn(date: Date, lang: 'bn' | 'en' = 'bn'): string {
  try {
    const formatted = new Intl.DateTimeFormat(lang === 'bn' ? 'bn-BD' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
    return lang === 'bn' ? toBengaliDigits(formatted) : formatted;
  } catch {
    return date.toDateString();
  }
}

const HIJRI_MONTHS_BN = [
  'মুহাররম',
  'সফর',
  'রবিউল আউয়াল',
  'রবিউস সানি',
  'জমাদিউল আউয়াল',
  'জমাদিউস সানি',
  'রজব',
  'শাবান',
  'রমজান',
  'শাওয়াল',
  'জিলকদ',
  'জিলহজ',
];

const HIJRI_MONTHS_EN = [
  'Muharram',
  'Safar',
  'Rabi al-Awwal',
  'Rabi al-Thani',
  'Jumada al-Awwal',
  'Jumada al-Thani',
  'Rajab',
  'Shaban',
  'Ramadan',
  'Shawwal',
  'Dhul Qadah',
  'Dhul Hijjah',
];

export function getHijriDateParts(date: Date, adjustmentDays = 0): {
  day: number;
  monthIndex: number;
  monthBn: string;
  monthEn: string;
  year: number;
  formattedBn: string;
  formattedEn: string;
} {
  const adjusted = new Date(date.getTime() + adjustmentDays * 86400000);
  try {
    const parts = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    }).formatToParts(adjusted);
    const day = Number(parts.find((p) => p.type === 'day')?.value || 1);
    const month = Number(parts.find((p) => p.type === 'month')?.value || 1);
    const yearRaw = parts.find((p) => p.type === 'year')?.value || '1447';
    const year = Number(yearRaw.replace(/\D/g, '')) || 1447;
    const monthIndex = Math.max(0, Math.min(11, month - 1));
    const monthBn = HIJRI_MONTHS_BN[monthIndex];
    const monthEn = HIJRI_MONTHS_EN[monthIndex];
    return {
      day,
      monthIndex,
      monthBn,
      monthEn,
      year,
      formattedBn: `${toBengaliDigits(day)} ${monthBn}, ${toBengaliDigits(year)} হিজরি`,
      formattedEn: `${day} ${monthEn}, ${year} AH`,
    };
  } catch {
    return {
      day: 1,
      monthIndex: 0,
      monthBn: 'মুহাররম',
      monthEn: 'Muharram',
      year: 1448,
      formattedBn: '১ মুহাররম, ১৪৪৮ হিজরি',
      formattedEn: '1 Muharram, 1448 AH',
    };
  }
}

export function formatBengaliCalendarDate(date: Date): string {
  // Bangla calendar (Revised Bangla Academy) approximation for Bangladesh
  const gDay = date.getDate();
  const gMonth = date.getMonth() + 1;
  const gYear = date.getFullYear();
  const isLeap = (gYear % 4 === 0 && gYear % 100 !== 0) || gYear % 400 === 0;

  const banglaMonths = [
    'বৈশাখ', 'জ্যৈষ্ঠ', 'আষাঢ়', 'শ্রাবণ', 'ভাদ্র', 'আশ্বিন',
    'কার্তিক', 'অগ্রহায়ণ', 'পৌষ', 'মাঘ', 'ফাল্গুন', 'চৈত্র',
  ];

  // Start dates of Bangla months in Bangladesh (Revised):
  // Baishakh: Apr 14, Jaishtha: May 15, Ashar: Jun 15, Srabon: Jul 16, Bhadro: Aug 16, Ashwin: Sep 16,
  // Kartik: Oct 17, Agrahayan: Nov 16, Poush: Dec 16, Magh: Jan 15, Falgun: Feb 14, Chaitra: Mar 15
  const monthStarts = [
    { m: 4, d: 14 },
    { m: 5, d: 15 },
    { m: 6, d: 15 },
    { m: 7, d: 16 },
    { m: 8, d: 16 },
    { m: 9, d: 16 },
    { m: 10, d: 17 },
    { m: 11, d: 16 },
    { m: 12, d: 16 },
    { m: 1, d: 15 },
    { m: 2, d: 14 },
    { m: 3, d: 15 },
  ];

  const banglaYear = gMonth > 4 || (gMonth === 4 && gDay >= 14) ? gYear - 593 : gYear - 594;

  let bMonthIdx = 0;
  let refYear = gYear;
  for (let i = 0; i < monthStarts.length; i++) {
    const start = monthStarts[i];
    const next = monthStarts[(i + 1) % 12];
    const curVal = gMonth * 100 + gDay;
    const sVal = start.m * 100 + start.d;
    const nVal = next.m * 100 + next.d;
    if (start.m <= next.m) {
      if (curVal >= sVal && curVal < nVal) {
        bMonthIdx = i;
        refYear = gYear;
        break;
      }
    } else {
      if (curVal >= sVal || curVal < nVal) {
        bMonthIdx = i;
        refYear = curVal < nVal ? gYear - 1 : gYear;
        break;
      }
    }
  }

  const startDate = new Date(refYear, monthStarts[bMonthIdx].m - 1, monthStarts[bMonthIdx].d);
  const diffDays = Math.floor((new Date(gYear, gMonth - 1, gDay).getTime() - startDate.getTime()) / 86400000) + 1;
  const maxDay = bMonthIdx === 10 && isLeap ? 31 : 31;
  const bDay = Math.max(1, Math.min(maxDay, diffDays));

  return `${toBengaliDigits(bDay)} ${banglaMonths[bMonthIdx]}, ${toBengaliDigits(banglaYear)} বঙ্গাব্দ`;
}

export function formatCountdown(ms: number, lang: 'bn' | 'en' = 'bn'): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  const raw = `${pad(h)}:${pad(m)}:${pad(s)}`;
  return lang === 'bn' ? toBengaliDigits(raw) : raw;
}
