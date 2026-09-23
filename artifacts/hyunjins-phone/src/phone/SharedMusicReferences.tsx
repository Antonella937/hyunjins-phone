import type { PhoneStore } from './config';

export function SharedMusicReferences({ store, app, detailId }: { store: PhoneStore; app: 'messages' | 'diary' | 'files'; detailId?: string }) {
  const refs = app === 'messages'
    ? (store.messages.find(thread => thread.id === detailId)?.messages || []).filter(message => message.kind === 'music' && message.audioTrackId).map(message => ({ id: message.audioTrackId!, label: message.text }))
    : app === 'diary'
      ? store.diary.filter(entry => entry.id === detailId && entry.audioTrackId).map(entry => ({ id: entry.audioTrackId!, label: entry.title }))
      : store.files.filter(file => file.audioTrackId).map(file => ({ id: file.audioTrackId!, label: file.name }));
  if (!refs.length) return null;
  return <section className="mt-6 space-y-3" aria-label="Shared original music">
    <p className="text-[10px] uppercase tracking-[.2em] text-white/40">Original Tracks references</p>
    {refs.map((reference, index) => {
      const track = (store.originalTracks || []).find(item => item.id === reference.id);
      return <div key={`${reference.id}-${index}`} className="rounded-xl border border-white/10 bg-white/5 p-3">
        <p className="mb-2 text-xs text-white/75">{reference.label}</p>
        {track?.audioId ? <audio controls preload="metadata" className="w-full" src={`/api/music/audio/${track.audioId}`}
          onPlay={event => document.querySelectorAll('audio').forEach(other => { if (other !== event.currentTarget) other.pause(); })} />
          : <p className="text-xs text-white/40">This track is no longer in Original Tracks.</p>}
      </div>;
    })}
  </section>;
}