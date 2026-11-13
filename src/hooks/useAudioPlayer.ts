import { useCallback, useEffect, useRef, useState } from 'react';
import { offlineDB } from '../utils/offlineStorage';

export interface AudioTrack {
  id: string;
  title: string;
  subtitle: string;
  url: string;
  surahNumber?: number;
  ayahNumber?: number;
}

export function useQuranAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [playlist, setPlaylist] = useState<AudioTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'none' | 'one' | 'all'>('none');
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const currentTrack = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null;

  const cleanupObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const playIndex = useCallback(
    async (tracks: AudioTrack[], idx: number) => {
      if (idx < 0 || idx >= tracks.length) return;
      const track = tracks[idx];
      if (!track.url) return;

      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;

      setIsLoading(true);
      setErrorMsg(null);
      setCurrentIndex(idx);
      cleanupObjectUrl();

      try {
        // Check IndexedDB offline audio cache first
        const cachedBlob = await offlineDB.getAudioBlob(track.url);
        if (cachedBlob) {
          const objUrl = URL.createObjectURL(cachedBlob);
          objectUrlRef.current = objUrl;
          audio.src = objUrl;
        } else {
          audio.src = track.url;
        }

        await audio.play();
        setIsPlaying(true);

        if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.subtitle,
            album: 'নূর লাইফ — আল-কুরআন',
          });
        }
      } catch {
        setIsPlaying(false);
        setErrorMsg('অডিও প্লে করা যায়নি। ইন্টারনেট সংযোগ বা অফলাইন ডাউনলোড পরীক্ষা করুন।');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const loadAndPlay = useCallback(
    (tracks: AudioTrack[], startIndex = 0) => {
      setPlaylist(tracks);
      playIndex(tracks, startIndex);
    },
    [playIndex]
  );

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setErrorMsg('অডিও পুনরায় চালু করা যায়নি।');
      }
    }
  }, [currentTrack, isPlaying]);

  const playNext = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentIndex + 1 < playlist.length) {
      playIndex(playlist, currentIndex + 1);
    } else if (repeatMode === 'all') {
      playIndex(playlist, 0);
    } else {
      setIsPlaying(false);
    }
  }, [currentIndex, playIndex, playlist, repeatMode]);

  const playPrev = useCallback(() => {
    if (playlist.length === 0) return;
    if (currentIndex > 0) {
      playIndex(playlist, currentIndex - 1);
    }
  }, [currentIndex, playIndex, playlist]);

  const seekTo = useCallback((sec: number) => {
    if (audioRef.current && Number.isFinite(sec)) {
      audioRef.current.currentTime = sec;
      setProgress(sec);
    }
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    cleanupObjectUrl();
    setIsPlaying(false);
    setCurrentIndex(-1);
  }, []);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => setProgress(audio.currentTime || 0);
    const onLoadedMeta = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (repeatMode === 'one') {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
      } else {
        playNext();
      }
    };
    const onError = () => {
      setIsLoading(false);
      setIsPlaying(false);
      setErrorMsg('অডিও লোড ব্যর্থ হয়েছে।');
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMeta);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMeta);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [playNext, repeatMode]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      cleanupObjectUrl();
    };
  }, []);

  return {
    currentTrack,
    currentIndex,
    playlist,
    isPlaying,
    isLoading,
    progress,
    duration,
    repeatMode,
    setRepeatMode,
    errorMsg,
    loadAndPlay,
    togglePlay,
    playNext,
    playPrev,
    seekTo,
    stop,
  };
}

// Clean Web Audio chime/tone for Tasbih tap or Prayer alert test (zero external file dependency)
export function playGentleTone(type: 'tap' | 'adhan-chime' = 'tap') {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'tap') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.07);
    } else {
      // Pleasant two-note mosque bell / chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.25); // A5
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9);
      osc.start();
      osc.stop(ctx.currentTime + 0.95);
    }
  } catch {
    // ignore audio policy block
  }
}
