import { ArrowLeft, Music2, Pause, Play, Volume2 } from 'lucide-react';
import type { PhoneStore } from './config';

type MusicDetail = { kind: string; id: string } | null;

type Props = {
  store: PhoneStore;
  detail: MusicDetail;
  setDetail: (d: MusicDetail) => void;
};

const songsFor = (playlist: PhoneStore['musicPlaylists'][number]) =>
  Array.isArray(playlist.songs)
    ? playlist.songs
    : String(playlist.songs || '').split('\n').map(song => song.trim()).filter(Boolean);

export function MusicApp({ store, detail, setDetail }: Props) {
  const playlists = store.musicPlaylists || [];
  const selected = detail?.kind === 'playlist' ? playlists.find(playlist => playlist.id === detail.id) : undefined;

  if (detail?.kind === 'playlist') {
    if (!selected) {
      return <button onClick={() => setDetail(null)} className="text-sm text-[#e5a9b3]">← music</button>;
    }
    const songs = songsFor(selected);
    return (
      <div>
        <button onClick={() => setDetail(null)} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]" data-testid="button-playlist-back">
          <ArrowLeft size={15} /> music
        </button>
        <div className="flex items-end gap-4">
          <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br from-[#e0a8a9] via-[#9a7b9d] to-[#28334c] shadow-lg">
            <Music2 size={35} className="text-white/80" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[.2em] text-white/40">playlist</p>
            <h1 className="mt-1 font-serif text-3xl">{selected.name}</h1>
            <p className="mt-1 text-xs text-white/45">{songs.length} songs · made slowly</p>
          </div>
        </div>
        <div className="mt-8 space-y-1">
          {songs.map((song, index) => (
            <button key={`${song}-${index}`} className="flex w-full items-center gap-3 rounded-xl p-3 text-left hover:bg-white/10" data-testid={`button-song-${index}`}>
              <span className="w-5 text-center text-xs text-white/30">{index + 1}</span>
              <span className="flex-1 text-sm">{song}</span>
              <span className="text-[10px] text-white/35">3:{String(12 + index * 8).padStart(2, '0')}</span>
              <Play size={14} className="text-white/30" />
            </button>
          ))}
          {!songs.length && <p className="py-5 text-center text-sm text-white/35">No songs in this playlist yet.</p>}
        </div>
      </div>
    );
  }

  const nowPlaying = playlists[0] ? songsFor(playlists[0])[0] || 'Nothing playing' : 'Nothing playing';
  return (
    <div>
      <div className="mb-7"><p className="text-xs text-white/45">soundtrack, mostly after dark</p><h1 className="mt-1 font-serif text-4xl">Music</h1></div>
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#614a6b] via-[#a87888] to-[#e1b990] p-5">
        <div className="flex items-center justify-between"><span className="text-[10px] uppercase tracking-[.2em] text-white/65">now playing</span><Volume2 size={15} /></div>
        <div className="mt-12"><p className="font-serif text-3xl">{nowPlaying}</p><p className="mt-1 text-xs text-white/65">{nowPlaying === 'Pink + White' ? 'Frank Ocean · Blonde' : playlists[0]?.name || 'Choose a playlist'}</p></div>
        <div className="mt-5 h-1 rounded-full bg-white/25"><span className="block h-1 w-[43%] rounded-full bg-white/80" /></div>
        <div className="mt-2 flex justify-between text-[9px] text-white/60"><span>1:48</span><span>3:04</span></div>
        <div className="mt-5 flex justify-center"><button className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#503b57]" data-testid="button-music-play"><Pause size={18} fill="currentColor" /></button></div>
      </div>
      <p className="mb-3 mt-7 text-[10px] uppercase tracking-[.2em] text-white/40">playlists</p>
      <div className="grid grid-cols-2 gap-3">
        {playlists.map((playlist, index) => {
          const songs = songsFor(playlist);
          return <button key={playlist.id} onClick={() => setDetail({ kind: 'playlist', id: playlist.id })} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left" data-testid={`card-playlist-${index}`}>
            <span className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#39405b] to-[#bc8998]"><Music2 size={22} className="text-white/70" /></span>
            <p className="mt-3 text-sm">{playlist.name}</p><p className="mt-1 text-[10px] text-white/40">{songs.length} songs</p>
          </button>;
        })}
      </div>
    </div>
  );
}