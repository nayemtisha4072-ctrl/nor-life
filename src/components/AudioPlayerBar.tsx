import React from 'react';
import { Pause, Play, Repeat, SkipBack, SkipForward, Volume2, X } from 'lucide-react';
import { AudioTrack } from '../hooks/useAudioPlayer';
import { toBengaliDigits } from '../utils/bengaliDigits';

interface Props {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isLoading: boolean;
  progress: number;
  duration: number;
  repeatMode: 'none' | 'one' | 'all';
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (sec: number) => void;
  onToggleRepeat: () => void;
  onStop: () => void;
}

function fmtSec(sec: number): string {
  if (!Number.isFinite(sec) || sec <= 0) return '০০:০০';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return toBengaliDigits(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
}

export const AudioPlayerBar: React.FC<Props> = ({
  currentTrack,
  isPlaying,
  isLoading,
  progress,
  duration,
  repeatMode,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleRepeat,
  onStop,
}) => {
  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-16 lg:bottom-4 left-2 right-2 lg:left-auto lg:right-6 lg:w-[430px] z-40 rounded-2xl bg-[#10182B] text-white border border-[#2457D6]/40 shadow-2xl px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[#2457D6] flex items-center justify-center shrink-0">
            <Volume2 className="w-4 h-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{currentTrack.title}</p>
            <p className="text-[11px] text-blue-200 truncate">{currentTrack.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onPrev}
            aria-label="পূর্ববর্তী আয়াত"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'বিরতি' : 'চালান'}
            className="w-10 h-10 rounded-xl bg-[#D92735] hover:bg-[#E53945] flex items-center justify-center transition-colors"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <button
            onClick={onNext}
            aria-label="পরবর্তী আয়াত"
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
          <button
            onClick={onToggleRepeat}
            title={`রিপিট: ${repeatMode}`}
            aria-label="রিপিট মোড"
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
              repeatMode !== 'none' ? 'bg-[#2457D6] text-white' : 'text-slate-300 hover:bg-white/10'
            }`}
          >
            <Repeat className="w-4 h-4" />
          </button>
          <button
            onClick={onStop}
            aria-label="অডিও বন্ধ করুন"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2 text-[10px] text-blue-200 tabular-nums">
        <span>{fmtSec(progress)}</span>
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={progress}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 accent-[#3478F6] h-1 cursor-pointer"
        />
        <span>{fmtSec(duration)}</span>
      </div>
    </div>
  );
};
