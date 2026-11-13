import React from 'react';
import {
  ArrowLeft,
  BookOpen,
  Calculator,
  Calendar,
  Compass,
  Heart,
  Image as ImageIcon,
  Moon,
  ScrollText,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../hooks/useAppStore';
import { QiblaCompassTool } from '../components/tools/QiblaCompassTool';
import { DigitalTasbihTool } from '../components/tools/DigitalTasbihTool';
import { AsmaUlHusnaTool, DuasLibraryTool } from '../components/tools/DuasAndNamesTool';
import {
  IslamicCalendarTool,
  RamadanFastingTool,
  ZakatCalculatorTool,
} from '../components/tools/CalendarRamadanZakatTool';
import {
  HadithKnowledgeTool,
  WallpapersAndCardsTool,
} from '../components/tools/KnowledgeWallpapersTool';

interface Props {
  onOpenLocationModal: () => void;
}

const TOOL_CARDS = [
  {
    id: 'qibla',
    titleBn: 'কিবলা কম্পাস',
    descBn: 'লাইভ কম্পাস সেন্সর, কাবা দিক ও দূরত্ব নির্ণয়',
    icon: Compass,
    accent: 'text-[#D92735] bg-[#D92735]/10',
  },
  {
    id: 'tasbih',
    titleBn: 'ডিজিটাল তাসবিহ',
    descBn: 'জিকির গণনা, লক্ষ্য নির্ধারণ ও দৈনিক ইতিহাস',
    icon: Sparkles,
    accent: 'text-[#2457D6] bg-[#2457D6]/10',
  },
  {
    id: 'duas',
    titleBn: 'দোয়া ও জিকির ভাণ্ডার',
    descBn: '১৫টি বিষয়ের মাসনুন দোয়া, উচ্চারণ ও হাদিস সূত্র',
    icon: Heart,
    accent: 'text-[#D92735] bg-[#D92735]/10',
  },
  {
    id: 'names99',
    titleBn: 'আল্লাহর ৯৯ নাম',
    descBn: 'আসমাউল হুসনা — আরবি, উচ্চারণ, অর্থ ও ব্যাখ্যা',
    icon: ScrollText,
    accent: 'text-[#2457D6] bg-[#2457D6]/10',
  },
  {
    id: 'calendar',
    titleBn: 'ইসলামিক ক্যালেন্ডার',
    descBn: 'বাংলা, ইংরেজি ও চাঁদ দেখা সমন্বিত হিজরি তারিখ',
    icon: Calendar,
    accent: 'text-[#D92735] bg-[#D92735]/10',
  },
  {
    id: 'ramadan',
    titleBn: 'রমজান ও রোজা',
    descBn: 'সেহরি-ইফতারের সময়সূচি, রোজা ট্র্যাকার ও মাসআলা',
    icon: Moon,
    accent: 'text-[#2457D6] bg-[#2457D6]/10',
  },
  {
    id: 'zakat',
    titleBn: 'যাকাত ক্যালকুলেটর',
    descBn: 'নিসাব হিসাব, সম্পদ-দায় বিশ্লেষণ ও প্রদেয় যাকাত',
    icon: Calculator,
    accent: 'text-[#D92735] bg-[#D92735]/10',
  },
  {
    id: 'knowledge',
    titleBn: 'হাদিস ও ইসলামিক জ্ঞান',
    descBn: 'সহীহ বুখারী-মুসলিম, নবীদের জীবনী ও ইসলামিক কুইজ',
    icon: BookOpen,
    accent: 'text-[#2457D6] bg-[#2457D6]/10',
  },
  {
    id: 'wallpapers',
    titleBn: 'ওয়ালপেপার ও দোয়া কার্ড',
    descBn: 'এইচডি ইসলামিক ওয়ালপেপার ও শেয়ারযোগ্য কার্ড',
    icon: ImageIcon,
    accent: 'text-[#D92735] bg-[#D92735]/10',
  },
];

export const ToolsModule: React.FC<Props> = ({ onOpenLocationModal }) => {
  const { activeToolId, setActiveToolId, t } = useAppStore();

  const currentMeta = TOOL_CARDS.find((c) => c.id === activeToolId);

  if (activeToolId && currentMeta) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveToolId(null)}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-white dark:bg-[#19243A] border border-slate-200 dark:border-slate-700 text-[#10182B] dark:text-white hover:border-[#2457D6]"
            aria-label={t('টুলস তালিকায় ফিরুন', 'Back to tools')}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-[#10182B] dark:text-white">{currentMeta.titleBn}</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{currentMeta.descBn}</p>
          </div>
        </div>

        {activeToolId === 'qibla' && <QiblaCompassTool onOpenLocationModal={onOpenLocationModal} />}
        {activeToolId === 'tasbih' && <DigitalTasbihTool />}
        {activeToolId === 'duas' && <DuasLibraryTool />}
        {activeToolId === 'names99' && <AsmaUlHusnaTool />}
        {activeToolId === 'calendar' && <IslamicCalendarTool />}
        {activeToolId === 'ramadan' && <RamadanFastingTool />}
        {activeToolId === 'zakat' && <ZakatCalculatorTool />}
        {activeToolId === 'knowledge' && <HadithKnowledgeTool />}
        {activeToolId === 'wallpapers' && <WallpapersAndCardsTool />}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-[#10182B] dark:text-white">
          {t('ইসলামিক টুলস ও জ্ঞানভাণ্ডার', 'Islamic Tools & Knowledge')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {t('দৈনন্দিন ইবাদত ও ইসলামিক জীবনযাপনের জন্য প্রয়োজনীয় সকল টুলস', 'Essential Islamic tools for daily worship and learning')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOL_CARDS.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.id}
              onClick={() => setActiveToolId(card.id)}
              className="rounded-2xl bg-white dark:bg-[#19243A] border border-slate-200/80 dark:border-slate-700/60 p-5 text-left flex items-start gap-4 hover:border-[#2457D6] transition-colors min-h-[104px]"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${card.accent}`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#10182B] dark:text-white">{card.titleBn}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{card.descBn}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
