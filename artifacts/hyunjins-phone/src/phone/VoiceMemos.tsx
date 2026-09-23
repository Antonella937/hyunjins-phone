import { useEffect, useRef, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { ArrowLeft, ChevronRight, Mic2, Pause, Play, Trash2 } from 'lucide-react';
import { useGenerateVoiceAudio, useGenerateVoiceTranscript, useGetStoryProviders } from '@workspace/api-client-react';
import type { PhoneStore, VoiceMemo } from './config';

type Detail = { kind: string; id: string } | null;
type Language = NonNullable<VoiceMemo['language']>;
type VoiceId = NonNullable<VoiceMemo['voiceId']>;
const voices: { id: VoiceId; label: string }[] = [
  { id: 'onyx', label: 'Soft low voice' },
  { id: 'echo', label: 'Warm voice' },
  { id: 'alloy', label: 'Gentle voice' },
];
const formatTime = (value: number) => Number.isFinite(value) ? `${Math.floor(value / 60)}:${String(Math.floor(value % 60)).padStart(2, '0')}` : '0:00';
const audioUrl = (id: string) => `/api/story/voice/audio/${encodeURIComponent(id)}`;

export function VoiceMemos({ store, setStore, detail, setDetail, editMode }: {
  store: PhoneStore;
  setStore: Dispatch<SetStateAction<PhoneStore>>;
  detail: Detail;
  setDetail: (detail: Detail) => void;
  editMode: boolean;
}) {
  const memo = detail?.kind === 'voice' ? store.voice.find(item => item.id === detail.id) : undefined;
  const [creating, setCreating] = useState(false);
  const [draftMode, setDraftMode] = useState<'transcript' | 'prompt'>('transcript');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftText, setDraftText] = useState('');
  const [draftContext, setDraftContext] = useState('');
  const [draftDelivery, setDraftDelivery] = useState('soft, casual');
  const [draftCategory, setDraftCategory] = useState('private reflection');
  const [draftRelatedEvent, setDraftRelatedEvent] = useState('');
  const [draftLanguage, setDraftLanguage] = useState<Language>('English');
  const [reviewingDraft, setReviewingDraft] = useState(false);
  const [voiceId, setVoiceId] = useState<VoiceId>('onyx');
  const [language, setLanguage] = useState<Language>('English');
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [audioFailed, setAudioFailed] = useState(false);
  const [working, setWorking] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptMutation = useGenerateVoiceTranscript();
  const audioMutation = useGenerateVoiceAudio();
  const { data: providers } = useGetStoryProviders();
  const audioConnected = providers?.audio.connected === true;

  useEffect(() => {
    const audio = audioRef.current;
    audio?.pause();
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setAudioFailed(false);
    setVoiceId(memo?.voiceId || 'onyx');
    setLanguage(memo?.language || 'English');
    setError('');
    return () => { audio?.pause(); };
  }, [memo?.id, memo?.audioId]);

  const commit = (update: (current: PhoneStore) => PhoneStore) => {
    // The same key and collections used by Edit Mode and Story Admin.
    // Commit before showing success; keep every unrelated field, including Gallery data.
    const stored = localStorage.getItem('hyunjin-phone-store');
    const current: PhoneStore = stored ? JSON.parse(stored) : store;
    const next = update(current);
    const serialized = JSON.stringify(next);
    localStorage.setItem('hyunjin-phone-store', serialized);
    if (localStorage.getItem('hyunjin-phone-store') !== serialized) throw new Error('Phone storage did not confirm the save.');
    setStore(next);
  };

  const generateTranscript = async () => {
    if (!draftText.trim()) return;
    setError('');
    try {
      const result = await transcriptMutation.mutateAsync({ data: { prompt: draftText.trim(), language: draftLanguage } });
      setDraftTitle(result.title);
      setDraftText(result.transcript);
      setDraftContext(result.context);
      setDraftDelivery(result.delivery);
      setDraftCategory(result.category);
      setDraftRelatedEvent(result.relatedEvent || '');
      setReviewingDraft(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate transcript.');
    }
  };

  const confirmDraft = () => {
    if (!draftTitle.trim() || !draftText.trim()) { setError('A title and transcript are required.'); return; }
    const id = `v-${crypto.randomUUID()}`;
    const newMemo: VoiceMemo = {
      id, title: draftTitle.trim(), transcript: draftText.trim(),
      date: new Date().toLocaleString(), duration: '—', private: true,
      language: draftLanguage, context: draftContext.trim(), delivery: draftDelivery.trim(),
      category: draftCategory.trim(), relatedEvent: draftRelatedEvent.trim(),
    };
    try {
      commit(current => ({ ...current, voice: [newMemo, ...current.voice] }));
      setCreating(false);
      setReviewingDraft(false);
      setDraftText('');
      setDraftTitle('');
      setDetail({ kind: 'voice', id });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save voice memo.');
    }
  };

  const generateAudio = async () => {
    if (!memo || !audioConnected || working) return;
    setWorking(true);
    setError('');
    try {
      const result = await audioMutation.mutateAsync({
        data: { transcript: memo.transcript, voice: voiceId, language, delivery: memo.delivery || '' },
      });
      commit(current => ({
        ...current,
        voice: current.voice.map(item => item.id === memo.id ? {
          ...item, audioId: result.audioId, durationSeconds: result.durationSeconds,
          duration: formatTime(result.durationSeconds), voiceId, language,
        } : item),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not generate or save audio.');
    } finally {
      setWorking(false);
    }
  };

  const playPause = async () => {
    const audio = audioRef.current;
    if (!memo?.audioId || !audio) {
      setError('No audio has been generated for this memo yet.');
      return;
    }
    if (audioFailed) {
      setError('Unable to load audio.');
      return;
    }
    if (!audio.paused) {
      audio.pause();
      setPlaying(false);
      return;
    }
    try {
      if (audio.ended) audio.currentTime = 0;
      setError('');
      await audio.play();
    } catch (err) {
      // Pausing while the browser is still resolving play() aborts its promise.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(audio.error ? 'Unable to load audio.' : err instanceof Error ? `Unable to play audio: ${err.message}` : 'Unable to play audio.');
    }
  };

  const restart = async () => {
    const audio = audioRef.current;
    if (!audio || audioFailed) { setError('Unable to load audio.'); return; }
    audio.currentTime = 0;
    setCurrentTime(0);
    try {
      setError('');
      await audio.play();
    } catch (err) {
      setError(audio.error ? 'Unable to load audio.' : err instanceof Error ? `Unable to play audio: ${err.message}` : 'Unable to play audio.');
    }
  };

  if (creating) return <div>
    <button onClick={() => { setCreating(false); setReviewingDraft(false); setError(''); }} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]"><ArrowLeft size={15} /> recordings</button>
    <h1 className="font-serif text-3xl">New AI Voice Memo</h1>
    <p className="mt-2 text-xs text-white/45">Write a transcript or describe what the memo should say. Audio is generated only after you approve the text.</p>
    {!reviewingDraft && <div className="mt-6 flex gap-2">
      <button onClick={() => { setDraftMode('transcript'); setDraftText(''); }} className={`rounded-xl border px-3 py-2 text-xs ${draftMode === 'transcript' ? 'border-[#d98ca7]' : 'border-white/10'}`}>Complete transcript</button>
      <button onClick={() => { setDraftMode('prompt'); setDraftText(''); }} className={`rounded-xl border px-3 py-2 text-xs ${draftMode === 'prompt' ? 'border-[#d98ca7]' : 'border-white/10'}`}>Short prompt</button>
    </div>}
    <div className="mt-5 space-y-3">
      {(reviewingDraft || draftMode === 'transcript') && <input value={draftTitle} onChange={e => setDraftTitle(e.target.value)} placeholder="Memo title" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />}
      <textarea value={draftText} onChange={e => setDraftText(e.target.value)} rows={7} placeholder={draftMode === 'prompt' && !reviewingDraft ? 'A sleepy reminder about an unfinished drawing…' : 'What does the memo say?'} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 outline-none" />
      <label className="block text-xs text-white/55">Language
        <select value={draftLanguage} onChange={e => setDraftLanguage(e.target.value as Language)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#211e2b] p-3 text-sm text-white">
          {(['English', 'Korean', 'Mixed'] as const).map(value => <option key={value}>{value}</option>)}
        </select>
      </label>
      {(reviewingDraft || draftMode === 'transcript') && <>
        <input value={draftContext} onChange={e => setDraftContext(e.target.value)} placeholder="Context (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />
        <input value={draftDelivery} onChange={e => setDraftDelivery(e.target.value)} placeholder="Emotional delivery" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />
        <input value={draftCategory} onChange={e => setDraftCategory(e.target.value)} placeholder="Category" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />
        <input value={draftRelatedEvent} onChange={e => setDraftRelatedEvent(e.target.value)} placeholder="Related event (optional)" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm outline-none" />
      </>}
    </div>
    {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
    {draftMode === 'prompt' && !reviewingDraft
      ? <button onClick={generateTranscript} disabled={transcriptMutation.isPending || !draftText.trim()} className="mt-5 w-full rounded-xl bg-[#d98ca7] py-3 text-sm text-[#291d26] disabled:opacity-50">{transcriptMutation.isPending ? 'Drafting transcript…' : 'Generate Transcript'}</button>
      : <button onClick={confirmDraft} disabled={!draftTitle.trim() || !draftText.trim()} className="mt-5 w-full rounded-xl bg-[#d98ca7] py-3 text-sm text-[#291d26] disabled:opacity-50">Confirm Transcript</button>}
  </div>;

  if (memo) return <div>
    <button onClick={() => setDetail(null)} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]" data-testid="button-voice-back"><ArrowLeft size={15} /> recordings</button>
    <div className="flex items-center gap-3"><span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8b91ba] text-[#242038]"><Mic2 size={24} /></span><div><p className="text-xs text-white/45">{memo.date} · {memo.audioId ? (duration ? formatTime(duration) : memo.duration) : 'Transcript Only'}</p><h1 className="mt-1 font-serif text-3xl">{memo.title}</h1></div></div>
    {(memo.context || memo.category || memo.relatedEvent) && <p className="mt-4 text-xs text-white/45">{[memo.category, memo.context, memo.relatedEvent].filter(Boolean).join(' · ')}</p>}
    {memo.audioId && <audio key={memo.audioId} ref={audioRef} src={audioUrl(memo.audioId)} preload="metadata"
      onLoadedMetadata={e => { if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) { setDuration(e.currentTarget.duration); setAudioFailed(false); } }}
      onTimeUpdate={e => setCurrentTime(e.currentTarget.currentTime)}
      onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
      onError={() => { setAudioFailed(true); setPlaying(false); setError('Unable to load audio.'); }} />}
    <div className="mt-10 flex h-24 items-center justify-center gap-1 rounded-3xl bg-white/[.05] px-7">{Array.from({ length: 40 }, (_, i) => <span key={i} className={`w-1 rounded-full ${memo.audioId && i / 40 <= currentTime / (duration || memo.durationSeconds || 1) ? 'bg-[#d98ca7]' : 'bg-[#b2a3c4]/70'}`} style={{ height: `${12 + ((i * 17) % 50)}%` }} />)}</div>
    {memo.audioId && !audioFailed && <input aria-label="Seek audio" type="range" min={0} max={duration || memo.durationSeconds || 1} step={0.1} value={Math.min(currentTime, duration || memo.durationSeconds || 1)} onChange={e => { if (audioRef.current) audioRef.current.currentTime = Number(e.target.value); setCurrentTime(Number(e.target.value)); }} className="mt-3 w-full accent-[#d98ca7]" />}
    <div className="mt-5 flex items-center justify-between text-xs text-white/40">
      <button onClick={playPause} className={`flex items-center gap-2 rounded-full px-4 py-2 ${memo.audioId && !audioFailed ? 'bg-[#d98ca7] text-[#291d26]' : 'border border-white/15 text-white/50'}`} data-testid="button-play-voice">{playing ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}{playing ? 'pause' : 'play'}</button>
      <span>{memo.audioId && !audioFailed ? `${formatTime(currentTime)} / ${formatTime(duration || memo.durationSeconds || 0)}` : '— / —'}</span>
      {memo.audioId && !audioFailed && <button onClick={restart} className="rounded-full border border-white/15 px-2 py-1" aria-label="Restart audio">restart</button>}
      <button onClick={() => { const next = speed === 1 ? 1.25 : speed === 1.25 ? 1.5 : speed === 1.5 ? 0.75 : 1; setSpeed(next); if (audioRef.current) audioRef.current.playbackRate = next; }} disabled={!memo.audioId || audioFailed} className="rounded-full border border-white/15 px-2 py-1 disabled:opacity-40">{speed}×</button>
    </div>
    <div className="mt-7 flex flex-wrap items-center gap-2">
      <select value={voiceId} onChange={e => setVoiceId(e.target.value as VoiceId)} aria-label="Fictional voice" className="rounded-xl border border-white/10 bg-[#211e2b] px-3 py-2 text-xs text-white">{voices.map(voice => <option key={voice.id} value={voice.id}>{voice.label}</option>)}</select>
      <select value={language} onChange={e => setLanguage(e.target.value as Language)} aria-label="Audio language" className="rounded-xl border border-white/10 bg-[#211e2b] px-3 py-2 text-xs text-white">{(['English', 'Korean', 'Mixed'] as const).map(value => <option key={value}>{value}</option>)}</select>
      <button onClick={generateAudio} disabled={!audioConnected || working} className="rounded-xl border border-[#d98ca7]/50 px-3 py-2 text-xs text-[#e7aabb] disabled:opacity-40">{working ? 'Generating audio…' : memo.audioId ? '✨ Regenerate Audio' : '✨ Generate Audio'}</button>
    </div>
    {!audioConnected && <p role="status" className="mt-3 text-xs text-amber-200">Audio AI Provider Not Connected</p>}
    {error && <p role="alert" className="mt-3 text-xs text-red-300">{error}</p>}
    <div className="mt-10 border-t border-white/10 pt-5"><p className="text-[10px] uppercase tracking-[.2em] text-white/35">transcript</p><p className="mt-3 whitespace-pre-line text-sm leading-6 text-white/65">{memo.transcript}</p></div>
  </div>;

  return <div>
    <div className="mb-7 flex items-end justify-between"><div><p className="text-xs text-white/45">notes that needed a voice</p><h1 className="mt-1 font-serif text-4xl">Voice Memos</h1></div><button onClick={() => { setDraftMode('transcript'); setDraftText(''); setCreating(true); }} aria-label="New AI Voice Memo" className="rounded-full bg-[#d98ca7] p-3 text-[#2b1d27]" data-testid="button-add-voice"><Mic2 size={17} /></button></div>
    <button onClick={() => { setDraftMode('prompt'); setDraftText(''); setCreating(true); }} className="mb-6 rounded-xl border border-white/10 px-3 py-2 text-xs text-[#e7aabb]">New AI Voice Memo</button>
    <p className="mb-3 text-[10px] uppercase tracking-[.23em] text-white/45">private · sent to someone</p>
    <div className="space-y-3">{store.voice.map(item => <button key={item.id} onClick={() => setDetail({ kind: 'voice', id: item.id })} className="group flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left" data-testid={`card-voice-${item.id}`}><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8389b0]/70 text-[#242038]"><Mic2 size={17} /></span><span className="min-w-0 flex-1"><b className="block truncate text-sm font-medium">{item.title}</b><small className="mt-1 block text-[10px] text-white/40">{item.date} · {item.audioId ? item.duration : 'Transcript Only'}{item.private ? ' · private' : ' · sent to Antonella'}</small></span><ChevronRight size={15} className="text-white/25" />{editMode && <span onClick={e => { e.stopPropagation(); setStore(s => ({ ...s, voice: s.voice.filter(v => v.id !== item.id) })); }} className="rounded-full p-1.5 text-[#dd8998]" data-testid={`button-delete-voice-${item.id}`}><Trash2 size={14} /></span>}</button>)}</div>
  </div>;
}