import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Play, Pause, Plus, Image as ImageIcon, Star, Share, Trash, Music2, SkipBack, Settings2, RefreshCw, X } from 'lucide-react';
import { useGetMusicProvider, useGenerateOriginalTrack, useGenerateOriginalLyrics, useConfirmOriginalTrackPreview, useDiscardOriginalTrackPreview } from '@workspace/api-client-react';
import { ImagePicker } from './InstagramImagePicker';
import type { PhoneStore, OriginalTrack } from './config';

type MusicDetail = { kind: string; id: string } | null;

type Props = {
  store: PhoneStore & { originalTracks?: OriginalTrack[] };
  detail: MusicDetail;
  setDetail: (d: MusicDetail) => void;
  editMode?: boolean;
  commit?: (update: (s: PhoneStore) => PhoneStore) => void;
  onShare?: (track: OriginalTrack, destination: "messages" | "instagram" | "diary" | "files") => void;
};

function formatTime(s: number) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function CustomAudioPlayer({ audioId, autoPlay, onDurationLoaded }: { audioId: string, autoPlay?: boolean, onDurationLoaded?: (d: number) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const handlePlay = (e: Event) => {
      if (e.target !== audioRef.current) {
        audioRef.current?.pause();
      }
    };
    document.addEventListener('play', handlePlay, true);
    return () => document.removeEventListener('play', handlePlay, true);
  }, []);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    }
  }, [autoPlay, audioId]);

  const togglePlay = () => {
    if (audioRef.current?.paused) {
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    } else {
      audioRef.current?.pause();
    }
  };

  const restart = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Playback failed", e));
    }
  };

  const cycleSpeed = () => {
    if (audioRef.current) {
      const next = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 0.75 : 1;
      audioRef.current.playbackRate = next;
      setSpeed(next);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 p-4 border border-white/10 flex flex-col gap-3">
      <audio
        ref={audioRef}
        src={`/api/music/audio/${audioId}`}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={() => setProgress(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => {
          const d = audioRef.current?.duration || 0;
          setDuration(d);
          if (onDurationLoaded) onDurationLoaded(d);
        }}
        onEnded={() => setPlaying(false)}
      />
      <div className="flex items-center gap-3">
        <button onClick={restart} className="text-white/60 hover:text-white"><SkipBack size={18} /></button>
        <button onClick={togglePlay} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#251e2b]">
          {playing ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
        </button>
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          <input 
            type="range" 
            min={0} max={duration || 100} 
            value={progress}
            onChange={(e) => {
              if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
            }}
            className="w-full h-1 bg-white/20 rounded-full appearance-none outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
          />
          <div className="flex justify-between text-[10px] text-white/50 mt-1.5 font-mono">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button onClick={cycleSpeed} className="text-[10px] font-medium text-white/60 hover:text-white w-8 shrink-0 text-right">{speed}x</button>
      </div>
    </div>
  );
}

function GenerateAudioView({ track, onSave, onCancel }: { track: OriginalTrack, onSave: (data: any) => void, onCancel: () => void }) {
  const provider = useGetMusicProvider();
  const generateTrack = useGenerateOriginalTrack();
  const generateLyrics = useGenerateOriginalLyrics();
  const confirmPreview = useConfirmOriginalTrackPreview();
  const discardPreview = useDiscardOriginalTrackPreview();

  const [prompt, setPrompt] = useState(track.prompt || '');
  const [genre, setGenre] = useState(track.genre || '');
  const [mood, setMood] = useState(track.mood || '');
  const [mode, setMode] = useState<'instrumental'|'vocals'|'demo'|'loop'>(track.mode || 'instrumental');
  const [duration, setDuration] = useState(track.durationSeconds || 30);
  const [lyrics, setLyrics] = useState(track.lyrics || '');
  const [notes, setNotes] = useState(track.notes || '');

  const [preview, setPreview] = useState<{ audioId: string, durationSeconds: number, actualDuration: number, previewToken: string } | null>(null);
  const previewRef = useRef(preview);
  previewRef.current = preview;
  const [error, setError] = useState('');

  // Unmount cleanup for unconfirmed preview
  useEffect(() => {
    return () => {
      const p = previewRef.current;
      if (p) {
        fetch(`/api/music/audio/${p.audioId}/preview`, {
          method: 'DELETE',
          body: JSON.stringify({ previewToken: p.previewToken }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error(e));
      }
    };
  }, []);

  const handleDraftLyrics = async () => {
    try {
      setError('');
      const res = await generateLyrics.mutateAsync({ data: { prompt, genre, mood } });
      setLyrics(res.lyrics);
    } catch (err: any) {
      setError(err.message || 'Failed to generate lyrics');
    }
  };

  const discardCurrentPreview = async (): Promise<boolean> => {
    if (!preview) return true;
    try {
      setError('');
      await discardPreview.mutateAsync({ audioId: preview.audioId, data: { previewToken: preview.previewToken } });
      setPreview(null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to discard current preview');
      return false;
    }
  };

  const handleDiscard = async () => {
    await discardCurrentPreview();
  };

  const handleRegenerate = async () => {
    const success = await discardCurrentPreview();
    if (success) {
      await handleGenerate();
    }
  };

  const handleGenerate = async () => {
    try {
      setError('');
      const res = await generateTrack.mutateAsync({
        data: { prompt, mode, durationSeconds: duration, genre, mood, lyrics, notes }
      });
      setPreview({ audioId: res.audioId, durationSeconds: res.durationSeconds, actualDuration: res.durationSeconds, previewToken: res.previewToken });
    } catch (err: any) {
      setError(err.message || 'Failed to generate track');
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    try {
      setError('');
      await confirmPreview.mutateAsync({ audioId: preview.audioId, data: { previewToken: preview.previewToken } });
      const p = preview;
      onSave({ audioId: p.audioId, durationSeconds: p.actualDuration || p.durationSeconds, prompt, genre, mood, mode, lyrics, notes });
      setPreview(null); // clear only after successful onSave commit
    } catch (err: any) {
      setError(err.message || 'Failed to save generated track');
    }
  };

  if (!provider.data?.connected) {
    return (
      <div className="p-6 text-center bg-white/5 rounded-2xl border border-white/10 mt-8">
        <Settings2 size={24} className="mx-auto mb-3 text-white/40" />
        <h3 className="text-sm font-medium mb-1">Music AI Provider Not Connected</h3>
        <p className="text-xs text-white/50 mb-4">You need to connect a music provider to generate audio.</p>
        <button onClick={onCancel} className="px-4 py-2 bg-white/10 rounded-xl text-sm">Go Back</button>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="space-y-6 pb-20">
        <h2 className="text-xl font-serif">Preview Generation</h2>
        
        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
             <X size={14} className="mt-0.5 shrink-0" onClick={() => setError('')} />
             <p className="flex-1">{error}</p>
          </div>
        )}

        <CustomAudioPlayer audioId={preview.audioId} autoPlay onDurationLoaded={d => setPreview(p => p ? { ...p, actualDuration: d } : p)} />
        <div className="flex gap-2">
           <button onClick={handleDiscard} disabled={discardPreview.isPending} className="flex-1 py-3 bg-white/10 rounded-xl text-sm">
             {discardPreview.isPending ? 'Discarding...' : 'Discard'}
           </button>
           <button onClick={handleRegenerate} disabled={generateTrack.isPending || discardPreview.isPending} className="flex-1 py-3 bg-white/10 rounded-xl text-sm">
             {generateTrack.isPending ? 'Regenerating...' : 'Regenerate'}
           </button>
        </div>
        <button 
          onClick={handleSave}
          disabled={confirmPreview.isPending}
          className="w-full py-3 bg-[#d98ca7] text-[#251e2b] rounded-xl font-medium disabled:opacity-50"
        >
          {confirmPreview.isPending ? 'Saving...' : 'Save Track'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
         <button onClick={onCancel} className="text-sm text-white/50">Cancel</button>
         <span className="font-medium text-sm">Generate Audio</span>
         <div className="w-10"></div>
      </div>
      
      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
           <X size={14} className="mt-0.5 shrink-0" onClick={() => setError('')} />
           <p className="flex-1">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs text-white/50 block mb-1">Prompt</label>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-20" placeholder="Describe the track..." />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Mode</label>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10">
            <option value="instrumental" className="text-black">Instrumental</option>
            <option value="vocals" className="text-black">Vocals</option>
            <option value="demo" className="text-black">Demo</option>
            <option value="loop" className="text-black">Loop</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Duration (s)</label>
          <input type="number" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Genre</label>
          <input type="text" value={genre} onChange={e=>setGenre(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Mood</label>
          <input type="text" value={mood} onChange={e=>setMood(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
      </div>

      {mode === 'vocals' && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-white/50">Lyrics</label>
            <button onClick={handleDraftLyrics} disabled={generateLyrics.isPending} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/80">
              {generateLyrics.isPending ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
          <textarea value={lyrics} onChange={e=>setLyrics(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-32" />
        </div>
      )}

      <div>
        <label className="text-xs text-white/50 block mb-1">Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-20" />
      </div>

      <button onClick={handleGenerate} disabled={generateTrack.isPending || !prompt} className="w-full mt-4 py-3 bg-[#d98ca7] text-[#251e2b] rounded-xl font-medium flex justify-center items-center gap-2">
        {generateTrack.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Music2 size={16} />}
        Generate Track
      </button>
    </div>
  );
}

function CreateTrack({ store, commit, setDetail }: Props) {
  const provider = useGetMusicProvider();
  const generateTrack = useGenerateOriginalTrack();
  const generateLyrics = useGenerateOriginalLyrics();
  const confirmPreview = useConfirmOriginalTrackPreview();
  const discardPreview = useDiscardOriginalTrackPreview();

  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [mode, setMode] = useState<'instrumental'|'vocals'|'demo'|'loop'>('instrumental');
  const [duration, setDuration] = useState(30);
  const [lyrics, setLyrics] = useState('');
  const [notes, setNotes] = useState('');

  const [preview, setPreview] = useState<{ audioId: string, durationSeconds: number, actualDuration: number, previewToken: string } | null>(null);
  const previewRef = useRef(preview);
  previewRef.current = preview;
  const [error, setError] = useState('');

  useEffect(() => {
    return () => {
      const p = previewRef.current;
      if (p) {
        fetch(`/api/music/audio/${p.audioId}/preview`, {
          method: 'DELETE',
          body: JSON.stringify({ previewToken: p.previewToken }),
          headers: { 'Content-Type': 'application/json' }
        }).catch(e => console.error(e));
      }
    };
  }, []);

  const handleDraftLyrics = async () => {
    try {
      setError('');
      const res = await generateLyrics.mutateAsync({ data: { prompt, genre, mood } });
      setLyrics(res.lyrics);
    } catch (err: any) {
      setError(err.message || 'Failed to generate lyrics');
    }
  };

  const discardCurrentPreview = async (): Promise<boolean> => {
    if (!preview) return true;
    try {
      setError('');
      await discardPreview.mutateAsync({ audioId: preview.audioId, data: { previewToken: preview.previewToken } });
      setPreview(null);
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to discard current preview');
      return false;
    }
  };

  const handleDiscard = async () => {
    await discardCurrentPreview();
  };

  const handleRegenerate = async () => {
    const success = await discardCurrentPreview();
    if (success) {
      await handleGenerate();
    }
  };

  const handleGenerate = async () => {
    try {
      setError('');
      const res = await generateTrack.mutateAsync({
        data: { prompt, mode, durationSeconds: duration, genre, mood, lyrics, notes }
      });
      setPreview({ audioId: res.audioId, durationSeconds: res.durationSeconds, actualDuration: res.durationSeconds, previewToken: res.previewToken });
    } catch (err: any) {
      setError(err.message || 'Failed to generate track');
    }
  };

  const saveTrack = async (audioData?: { audioId: string, actualDuration: number, previewToken: string }) => {
    if (audioData) {
      try {
        setError('');
        await confirmPreview.mutateAsync({ audioId: audioData.audioId, data: { previewToken: audioData.previewToken } });
      } catch (err: any) {
        setError(err.message || 'Failed to save generated track');
        return; // Don't proceed to commit if saving fails
      }
    }

    try {
      const newTrack: OriginalTrack = {
        id: `ot-${Date.now()}`,
        title: title || 'Untitled Idea',
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }),
        type: mode === 'loop' ? 'Loop / Idea' : mode === 'instrumental' ? 'Instrumental' : mode === 'demo' ? 'Demo' : 'Full Song',
        status: audioData ? (mode === 'demo' || mode === 'loop' ? 'Demo' : 'Finished') : 'Idea',
        mode,
        genre, mood, prompt, lyrics, notes,
        favorite: false,
        source: audioData ? 'AI Generated' : 'Manual Idea',
        createdAt: new Date().toISOString(),
        ...(audioData ? { audioId: audioData.audioId, durationSeconds: audioData.actualDuration } : {})
      };
      
      if (!commit) throw new Error("Could not save to library");
      
      commit(s => ({ ...s, originalTracks: [newTrack, ...(s.originalTracks || [])] }));
      
      if (audioData) {
        setPreview(null); // Clear preview only after successful commit
      }
      setDetail({ kind: 'original-track', id: newTrack.id });
    } catch (err: any) {
      setError(err.message || "Could not commit metadata");
    }
  };

  if (preview) {
    return (
      <div className="space-y-6 pb-20">
        <h2 className="text-xl font-serif">Preview Generation</h2>

        {error && (
          <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
             <X size={14} className="mt-0.5 shrink-0" onClick={() => setError('')} />
             <p className="flex-1">{error}</p>
          </div>
        )}

        <CustomAudioPlayer audioId={preview.audioId} autoPlay onDurationLoaded={d => setPreview(p => p ? { ...p, actualDuration: d } : p)} />
        <div className="flex gap-2">
           <button onClick={handleDiscard} disabled={discardPreview.isPending} className="flex-1 py-3 bg-white/10 rounded-xl text-sm">
             {discardPreview.isPending ? 'Discarding...' : 'Discard'}
           </button>
           <button onClick={handleRegenerate} disabled={generateTrack.isPending || discardPreview.isPending} className="flex-1 py-3 bg-white/10 rounded-xl text-sm">
             {generateTrack.isPending ? 'Regenerating...' : 'Regenerate'}
           </button>
        </div>
        <button 
          onClick={() => saveTrack({ audioId: preview.audioId, actualDuration: preview.actualDuration || preview.durationSeconds, previewToken: preview.previewToken })}
          disabled={confirmPreview.isPending}
          className="w-full py-3 bg-[#d98ca7] text-[#251e2b] rounded-xl font-medium disabled:opacity-50"
        >
          {confirmPreview.isPending ? 'Saving...' : 'Save Track'}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20">
      <div className="flex items-center justify-between">
         <button onClick={() => setDetail({ kind: 'original-tracks', id: 'all' })} className="text-sm text-white/50">Cancel</button>
         <span className="font-medium text-sm">New Track</span>
         <button onClick={() => saveTrack()} className="text-sm text-[#d98ca7] font-medium">Save Idea</button>
      </div>
      
      {error && (
        <div className="rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
           <X size={14} className="mt-0.5 shrink-0" onClick={() => setError('')} />
           <p className="flex-1">{error}</p>
        </div>
      )}

      <div>
        <label className="text-xs text-white/50 block mb-1">Title (Optional)</label>
        <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 font-medium" placeholder="Untitled Idea" />
      </div>

      <div>
        <label className="text-xs text-white/50 block mb-1">Prompt</label>
        <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-20" placeholder="Describe the track..." />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Mode</label>
          <select value={mode} onChange={e=>setMode(e.target.value as any)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10">
            <option value="instrumental" className="text-black">Instrumental</option>
            <option value="vocals" className="text-black">Vocals</option>
            <option value="demo" className="text-black">Demo</option>
            <option value="loop" className="text-black">Loop</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Duration (s)</label>
          <input type="number" value={duration} onChange={e=>setDuration(Number(e.target.value))} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-white/50 block mb-1">Genre</label>
          <input type="text" value={genre} onChange={e=>setGenre(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
        <div>
          <label className="text-xs text-white/50 block mb-1">Mood</label>
          <input type="text" value={mood} onChange={e=>setMood(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10" />
        </div>
      </div>

      {mode === 'vocals' && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-xs text-white/50">Lyrics</label>
            <button onClick={handleDraftLyrics} disabled={generateLyrics.isPending} className="text-[10px] bg-white/10 px-2 py-1 rounded text-white/80">
              {generateLyrics.isPending ? 'Drafting...' : 'Draft with AI'}
            </button>
          </div>
          <textarea value={lyrics} onChange={e=>setLyrics(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-32" />
        </div>
      )}

      <div>
        <label className="text-xs text-white/50 block mb-1">Notes</label>
        <textarea value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-white/5 rounded-xl p-3 text-sm outline-none border border-white/10 min-h-20" />
      </div>

      {!provider.data?.connected ? (
        <div className="p-4 text-center bg-red-500/10 rounded-xl border border-red-500/20 text-red-400 mt-4">
          <p className="text-sm font-medium mb-3">Music AI Provider Not Connected</p>
          <button onClick={() => saveTrack()} className="w-full py-2 bg-red-500/20 rounded-lg text-sm text-red-300">Save as Idea Instead</button>
        </div>
      ) : (
        <button onClick={handleGenerate} disabled={generateTrack.isPending || !prompt} className="w-full mt-4 py-3 bg-[#d98ca7] text-[#251e2b] rounded-xl font-medium flex justify-center items-center gap-2">
          {generateTrack.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Music2 size={16} />}
          Generate Track
        </button>
      )}
    </div>
  );
}

function TrackDetail({ store, commit, setDetail, editMode, onShare, trackId }: Props & { trackId: string }) {
  const tracks = store.originalTracks || [];
  const track = tracks.find(t => t.id === trackId);
  const [showGenerate, setShowGenerate] = useState(false);
  const [pickingCover, setPickingCover] = useState<'gallery' | 'upload' | 'ai' | false>(false);
  const [shareError, setShareError] = useState('');
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (!track) {
    return <div className="p-6 text-center text-white/50">Track not found.</div>;
  }

  const handleShare = async (dest: "messages" | "instagram" | "diary" | "files") => {
    try {
      setShareError('');
      if (dest === 'instagram' && !track.coverImageId) {
        throw new Error('Cover image required for Instagram snippet');
      }
      await onShare?.(track, dest);
    } catch (err: any) {
      setShareError(err.message || 'Failed to share');
    }
  };

  if (pickingCover) {
    return (
      <div className="absolute inset-0 z-50 bg-[#251e2b]">
        <ImagePicker 
          store={store} commit={commit!} 
          initialTab={pickingCover === 'ai' ? 'ai' : pickingCover === 'upload' ? 'upload' : 'gallery'}
          onCancel={() => setPickingCover(false)}
          onSelect={(res) => {
            if (res.imageId) {
              commit?.(s => ({
                ...s,
                originalTracks: s.originalTracks?.map(t => t.id === track.id ? { ...t, coverImageId: res.imageId } : t)
              }));
            }
            setPickingCover(false);
          }}
        />
      </div>
    );
  }

  if (showGenerate) {
    return <GenerateAudioView track={track} onCancel={() => setShowGenerate(false)} onSave={(audioData) => {
      if (!commit) throw new Error("Could not save to library");
      commit(s => ({
        ...s,
         originalTracks: s.originalTracks?.map(t => t.id === track.id ? { ...t, ...audioData, status: t.mode === 'demo' || t.mode === 'loop' ? 'Demo' : 'Finished', source: 'AI Generated' } : t)
      }));
      setShowGenerate(false);
    }} />;
  }

  const updateField = (field: keyof OriginalTrack, value: any) => {
    commit?.(s => ({
      ...s,
      originalTracks: s.originalTracks?.map(t => t.id === track.id ? { ...t, [field]: value } : t)
    }));
  };

  const deleteTrack = () => {
    commit?.(s => ({
      ...s,
      originalTracks: s.originalTracks?.filter(t => t.id !== track.id)
    }));
    setDetail({ kind: 'original-tracks', id: 'all' });
  };

  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => setDetail({ kind: 'original-tracks', id: 'all' })} className="flex items-center gap-2 text-sm text-[#e5a9b3]">
          <ArrowLeft size={16} /> original tracks
        </button>
        <div className="flex gap-3">
          {track.audioId && onShare && (
            <div className="relative">
              <button onClick={() => setShowShareMenu(!showShareMenu)} className="text-white/60 hover:text-white"><Share size={18} /></button>
              {showShareMenu && (
                <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#251e2b] border border-white/10 shadow-xl overflow-hidden z-10">
                  <button onClick={() => { handleShare('messages'); setShowShareMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5">Messages</button>
                  <button onClick={() => { handleShare('instagram'); setShowShareMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5">Instagram Story</button>
                  <button onClick={() => { handleShare('diary'); setShowShareMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5">Diary</button>
                  <button onClick={() => { handleShare('files'); setShowShareMenu(false); }} className="w-full text-left px-4 py-3 text-sm hover:bg-white/5">Files</button>
                </div>
              )}
            </div>
          )}
          {editMode && (
             <button onClick={() => updateField('favorite', !track.favorite)} className="text-white/60 hover:text-[#e6b36a]">
               <Star size={18} fill={track.favorite ? '#e6b36a' : 'transparent'} className={track.favorite ? 'text-[#e6b36a]' : ''} />
             </button>
          )}
        </div>
      </div>
      
      {shareError && (
        <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
           <X size={14} className="mt-0.5 shrink-0" onClick={() => setShareError('')} />
           <p className="flex-1">{shareError}</p>
        </div>
      )}

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="relative mb-4 h-48 w-48 overflow-hidden rounded-3xl bg-white/10 shadow-lg group">
          {track.coverImageId ? (
             <img src={`/api/story/image/${track.coverImageId}`} className="h-full w-full object-cover" />
          ) : (
             <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#e0a8a9] to-[#39405b]">
               <Music2 size={48} className="text-white/50" />
             </div>
          )}
          {editMode && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100 gap-2">
              <button onClick={() => setPickingCover('gallery')} className="p-2 bg-white/20 rounded-full hover:bg-white/30"><ImageIcon size={18} /></button>
              <button onClick={() => setPickingCover('ai')} className="text-[10px] uppercase tracking-wider text-white bg-[#d98ca7]/40 px-3 py-1 rounded-full border border-[#d98ca7]/50 hover:bg-[#d98ca7]/60">AI Cover</button>
            </div>
          )}
        </div>

        {editMode ? (
          <input 
            value={track.title} 
            onChange={e => updateField('title', e.target.value)} 
            className="w-full bg-transparent text-center font-serif text-3xl outline-none border-b border-white/20 pb-1"
            placeholder="Track Title"
          />
        ) : (
          <h1 className="font-serif text-3xl">{track.title || 'Untitled'}</h1>
        )}
        
        <div className="mt-2 flex items-center justify-center gap-2 text-xs text-white/50">
           {editMode ? (
             <select value={track.status} onChange={e => updateField('status', e.target.value)} className="bg-transparent outline-none">
               <option className="text-black" value="Idea">Idea</option>
               <option className="text-black" value="Work in Progress">Work in Progress</option>
               <option className="text-black" value="Demo">Demo</option>
               <option className="text-black" value="Finished">Finished</option>
             </select>
           ) : (
             <span>{track.status}</span>
           )}
           <span>·</span>
           {editMode ? (
             <select value={track.type} onChange={e => updateField('type', e.target.value)} className="bg-transparent outline-none">
               <option className="text-black" value="Full Song">Full Song</option>
               <option className="text-black" value="Demo">Demo</option>
               <option className="text-black" value="Instrumental">Instrumental</option>
               <option className="text-black" value="Loop / Idea">Loop / Idea</option>
             </select>
           ) : (
             <span>{track.type}</span>
           )}
        </div>
      </div>

      {track.audioId ? (
        <div className="mb-8">
           <CustomAudioPlayer audioId={track.audioId} />
        </div>
      ) : (
        <div className="mb-8 flex justify-center">
          <button onClick={() => setShowGenerate(true)} className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium hover:bg-white/20">
            <Music2 size={16} /> Generate Track Audio
          </button>
        </div>
      )}

      <div className="space-y-6 rounded-2xl bg-white/[.02] p-5 border border-white/5">
         <div className="grid grid-cols-2 gap-4 text-sm">
           <div>
             <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Created</span>
             <span className="text-white/80">{track.date} {new Date(track.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
           </div>
           <div>
             <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Source</span>
             <span className="text-white/80">{track.source}</span>
           </div>
         </div>

         <div className="grid grid-cols-2 gap-4 text-sm">
           <div>
             <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Genre</span>
             {editMode ? <input value={track.genre || ''} onChange={e=>updateField('genre', e.target.value)} className="w-full bg-transparent border-b border-white/20 outline-none" /> : <span>{track.genre || '—'}</span>}
           </div>
           <div>
             <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Mood</span>
             {editMode ? <input value={track.mood || ''} onChange={e=>updateField('mood', e.target.value)} className="w-full bg-transparent border-b border-white/20 outline-none" /> : <span>{track.mood || '—'}</span>}
           </div>
         </div>

         <div>
           <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">AI Prompt</span>
           {editMode ? (
             <textarea value={track.prompt || ''} onChange={e=>updateField('prompt', e.target.value)} className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none border border-white/5 min-h-20" />
           ) : (
             <p className="text-white/80 text-sm whitespace-pre-wrap">{track.prompt || 'No prompt specified.'}</p>
           )}
         </div>

         <div>
           <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-1">Related Story Update</span>
           {editMode ? (
             <input value={track.relatedStoryUpdate || ''} onChange={e=>updateField('relatedStoryUpdate', e.target.value)} className="w-full bg-transparent border-b border-white/20 outline-none pb-1 text-sm" placeholder="e.g. story id" />
           ) : (
             <p className="text-white/80 text-sm">{track.relatedStoryUpdate || 'None'}</p>
           )}
         </div>

         <div>
           <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Lyrics</span>
           {editMode ? (
             <textarea value={track.lyrics || ''} onChange={e=>updateField('lyrics', e.target.value)} className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none min-h-24 border border-white/5" />
           ) : (
             <p className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">{track.lyrics || 'No lyrics.'}</p>
           )}
         </div>

         <div>
           <span className="block text-[10px] uppercase tracking-wider text-white/40 mb-2">Notes</span>
           {editMode ? (
             <textarea value={track.notes || ''} onChange={e=>updateField('notes', e.target.value)} className="w-full bg-black/20 rounded-xl p-3 text-sm outline-none min-h-24 border border-white/5" />
           ) : (
             <p className="whitespace-pre-wrap text-sm text-white/80 leading-relaxed">{track.notes || 'No notes.'}</p>
           )}
         </div>

         {editMode && (
           <div className="pt-4 mt-4 border-t border-white/10 text-center">
             <button onClick={deleteTrack} className="text-red-400 text-sm flex items-center justify-center gap-2 w-full py-2 bg-red-400/10 rounded-xl hover:bg-red-400/20">
               <Trash size={16} /> Delete Track
             </button>
           </div>
         )}
      </div>
    </div>
  );
}

function ListView({ store, setDetail }: Props) {
  const tracks = store.originalTracks || [];
  const [filter, setFilter] = useState('All');
  const [sort, setSort] = useState('Newest');
  const [inlinePlayingId, setInlinePlayingId] = useState<string | null>(null);

  let filtered = tracks;
  if (filter === 'Songs') filtered = tracks.filter(t => t.type === 'Full Song');
  if (filter === 'Demos') filtered = tracks.filter(t => t.type === 'Demo');
  if (filter === 'Instrumentals') filtered = tracks.filter(t => t.type === 'Instrumental');
  if (filter === 'Loops') filtered = tracks.filter(t => t.type === 'Loop / Idea');
  if (filter === 'Favorites') filtered = tracks.filter(t => t.favorite);

  if (sort === 'Newest') filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  if (sort === 'Oldest') filtered.sort((a,b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  if (sort === 'Title') filtered.sort((a,b) => a.title.localeCompare(b.title));

  return (
    <div className="pb-20">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={() => setDetail(null)} className="flex items-center gap-2 text-sm text-[#e5a9b3]">
          <ArrowLeft size={16} /> music
        </button>
        <button onClick={() => setDetail({ kind: 'new-original-track', id: 'new' })} className="flex items-center gap-1 rounded-full bg-[#d98ca7] px-3 py-1.5 text-xs font-medium text-[#251e2b]">
          <Plus size={14} /> New Track
        </button>
      </div>
      
      <h1 className="mb-6 font-serif text-3xl">Original Tracks</h1>
      
      <div className="mb-4 flex gap-2 overflow-x-auto scroll-thin pb-2">
        {['All', 'Songs', 'Demos', 'Instrumentals', 'Loops', 'Favorites'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs ${filter === f ? 'bg-white text-[#251e2b]' : 'bg-white/10 text-white/70'}`}>{f}</button>
        ))}
      </div>

      <div className="mb-4 flex justify-end">
        <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent text-xs text-white/50 outline-none">
          <option value="Newest" className="text-black">Newest First</option>
          <option value="Oldest" className="text-black">Oldest First</option>
          <option value="Title" className="text-black">Title A-Z</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(track => (
          <div key={track.id} className="flex flex-col gap-2 rounded-2xl bg-white/[.03] p-3 hover:bg-white/[.06]">
            <div className="flex w-full items-center gap-3">
              <button onClick={() => setDetail({ kind: 'original-track', id: track.id })} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 overflow-hidden">
                {track.coverImageId ? <img src={`/api/story/image/${track.coverImageId}`} className="h-full w-full object-cover" /> : <Music2 size={20} className="text-white/40" />}
              </button>
              <button onClick={() => setDetail({ kind: 'original-track', id: track.id })} className="flex-1 overflow-hidden text-left">
                <div className="flex items-center gap-2">
                  <h3 className="truncate font-medium text-sm">{track.title || 'Untitled'}</h3>
                  {track.favorite && <Star size={12} className="text-[#e6b36a]" fill="#e6b36a" />}
                </div>
                <p className="truncate text-xs text-white/50">{track.type} · {track.status}</p>
              </button>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <div className="text-xs text-white/40">
                  {track.audioId && track.durationSeconds ? formatTime(track.durationSeconds) : '--:--'}
                </div>
                {track.audioId && (
                  <button onClick={(e) => { e.stopPropagation(); setInlinePlayingId(inlinePlayingId === track.id ? null : track.id); }} className="text-[#d98ca7] hover:text-white p-1">
                    {inlinePlayingId === track.id ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
              </div>
            </div>
            {inlinePlayingId === track.id && track.audioId && (
              <div className="mt-2">
                <CustomAudioPlayer audioId={track.audioId} autoPlay />
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-white/40">No tracks found.</div>
        )}
      </div>
    </div>
  );
}

export function OriginalTracksApp(props: Props) {
  if (props.detail?.kind === 'original-tracks') {
    return <ListView {...props} />;
  }
  if (props.detail?.kind === 'original-track') {
    return <TrackDetail {...props} trackId={props.detail.id} />;
  }
  if (props.detail?.kind === 'new-original-track') {
    return <CreateTrack {...props} />;
  }
  return null;
}
