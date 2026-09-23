import { ArrowLeft, Music2, Pause, Play, Volume2, Search, SkipBack, SkipForward, Smartphone, Plus, ExternalLink } from 'lucide-react';
import type { PhoneStore, OriginalTrack } from './config';
import { OriginalTracksApp } from './OriginalTracksApp';
import { useSpotify, type SpotifyTrack, type SpotifySearchResults, type SpotifyPlaylistSummary } from './SpotifyProvider';
import { useState, useEffect } from 'react';

type MusicDetail = { kind: string; id: string } | null;

type Props = {
  store: PhoneStore;
  detail: MusicDetail;
  setDetail: (d: MusicDetail) => void;
  editMode?: boolean;
  commit?: (update: (s: PhoneStore) => PhoneStore) => void;
  onShare?: (track: OriginalTrack, destination: "messages" | "instagram" | "diary" | "files") => void;
};

const songsFor = (playlist: PhoneStore['musicPlaylists'][number]) =>
  Array.isArray(playlist.songs)
    ? playlist.songs
    : String(playlist.songs || '').split('\n').map(song => song.trim()).filter(Boolean);

export function MusicApp(props: Props) {
  if (props.detail?.kind === 'original-tracks' || props.detail?.kind === 'original-track' || props.detail?.kind === 'new-original-track') {
    return <OriginalTracksApp {...props} />;
  }
  return <SpotifyMusicApp {...props} />;
}

function SpotifyMusicApp(props: Props) {
  const { store, detail, setDetail } = props;
  const playlists = store.musicPlaylists || [];
  const selected = detail?.kind === 'playlist' ? playlists.find(playlist => playlist.id === detail.id) : undefined;

  const { playback, status, playerState, connectPlayer, play, pause, next, previous, seek, error: spotifyError, devices, transfer, loadSpotifyPlaylists } = useSpotify();
  
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylistSummary[]>([]);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  
  useEffect(() => {
    if (status?.status === 'connected') {
      loadSpotifyPlaylists().then(res => { setSpotifyPlaylists(res); setPlaylistError(null); })
        .catch(cause => setPlaylistError(cause instanceof Error ? cause.message : 'Could not load Spotify playlists.'));
    } else {
      setSpotifyPlaylists([]);
      setPlaylistError(null);
    }
  }, [status?.status, loadSpotifyPlaylists]);

  if (detail?.kind === 'playlist') {
    if (!selected) {
      return <button onClick={() => setDetail(null)} className="text-sm text-[#e5a9b3]">← music</button>;
    }
    const songs = songsFor(selected);
    const spotifyTracks = selected.spotifyTracks || [];
    
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
          {songs.map((song, index) => {
            const linkedTrack = spotifyTracks.find(t => t.name.toLowerCase() === song.toLowerCase());
            return (
              <button 
                key={`${song}-${index}`} 
                onClick={() => {
                  if (linkedTrack) void play(linkedTrack).catch(() => {});
                }}
                className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${linkedTrack ? 'hover:bg-white/10 cursor-pointer' : 'cursor-default opacity-70'}`} 
                data-testid={`button-song-${index}`}
              >
                <span className="w-5 text-center text-xs text-white/30">{index + 1}</span>
                <span className="flex-1 text-sm">{song}</span>
                {linkedTrack ? (
                  <>
                    <span className="text-[10px] text-white/35">
                      {Math.floor(linkedTrack.durationMs / 60000)}:{String(Math.floor((linkedTrack.durationMs % 60000) / 1000)).padStart(2, '0')}
                    </span>
                    <Play size={14} className="text-white/30" />
                  </>
                ) : (
                  <span className="text-[10px] text-white/35 italic">unlinked</span>
                )}
              </button>
            );
          })}
          {!songs.length && <p className="py-5 text-center text-sm text-white/35">No songs in this playlist yet.</p>}
          {spotifyError && <p role="alert" className="mt-3 rounded-xl bg-red-900/30 p-3 text-xs text-red-200">{spotifyError}</p>}
        </div>
      </div>
    );
  }

  if (detail?.kind === 'search') {
    return <SpotifySearch onBack={() => setDetail(null)} commit={props.commit} store={store} />;
  }

  const isSpotifyConnected = status?.status === 'connected';
  const trackName = playback?.track && isSpotifyConnected ? playback.track.name : isSpotifyConnected ? 'Nothing playing' : status ? 'Spotify not connected' : 'Checking Spotify…';
  const trackArtist = playback?.track && isSpotifyConnected
    ? [playback.track.artists.join(', '), playback.track.album].filter(Boolean).join(' · ')
    : isSpotifyConnected ? 'Choose a track to play' : 'Connect in Settings → Music → Spotify';
  const trackArtwork = isSpotifyConnected && playback?.track?.artwork ? playback.track.artwork : null;
  const durationMs = isSpotifyConnected && playback?.track ? playback.track.durationMs : 0;
  const progressMs = isSpotifyConnected && playback?.track ? playback.progressMs : 0;
  const progressPercent = durationMs > 0 ? Math.min(100, Math.max(0, progressMs / durationMs * 100)) : 0;
  
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isPlaying = isSpotifyConnected && playback?.isPlaying;

  const handlePlayPause = async () => {
    if (!isSpotifyConnected || !playback?.track || durationMs <= 0) return;
    if (playerState === 'activation_required') {
      await connectPlayer();
    }
    if (isPlaying) {
      await pause();
    } else {
      await play();
    }
  };
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isSpotifyConnected) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    seek(durationMs * percent).catch(() => {});
  };

  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/45">soundtrack, mostly after dark</p>
          <h1 className="mt-1 font-serif text-4xl">Music</h1>
        </div>
        {isSpotifyConnected && (
          <button onClick={() => setDetail({ kind: 'search', id: 'search' })} className="rounded-full bg-white/10 p-3 text-white hover:bg-white/20" data-testid="button-music-search">
            <Search size={18} />
          </button>
        )}
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#614a6b] via-[#a87888] to-[#e1b990] p-5">
        {trackArtwork && (
          <div className="absolute inset-0 opacity-40 mix-blend-overlay blur-xl transition-all duration-700">
            <img src={trackArtwork} className="h-full w-full object-cover" alt="" />
          </div>
        )}
        <div className="relative z-10 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-[.2em] text-white/65">now playing</span>
           {isSpotifyConnected && devices.length > 0 && (
            <select 
               aria-label="Spotify playback device"
               value={playback?.device?.id || ''} 
              onChange={e => transfer(e.target.value).catch(() => {})}
              className="appearance-none bg-transparent text-[10px] text-white/65 outline-none max-w-[120px] truncate text-right cursor-pointer"
            >
               <option value="" disabled>Select Device</option>
              {devices.map(d => <option key={d.id} value={d.id} className="text-black">{d.name}</option>)}
            </select>
          )}
          {(!isSpotifyConnected || devices.length === 0) && <Volume2 size={15} />}
        </div>
        <div className="relative z-10 mt-12 flex gap-4 items-center">
          {trackArtwork && (
            <img src={trackArtwork} className="h-16 w-16 rounded-xl shadow-lg object-cover" alt="Album Art" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-serif text-3xl truncate">{trackName}</p>
            <p className="mt-1 text-xs text-white/65 truncate">{trackArtist}</p>
            {playback?.track && <p className="mt-1 text-[10px] text-white/70">{playback.isPlaying ? 'playing' : 'paused'}</p>}
          </div>
        </div>
        <div className={`relative z-10 mt-5 h-1 rounded-full bg-white/25 ${durationMs ? 'cursor-pointer' : ''}`} onClick={handleSeek}>
          <span className="block h-1 rounded-full bg-white/80 transition-all duration-300" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="relative z-10 mt-2 flex justify-between text-[9px] text-white/60">
          <span>{durationMs ? formatTime(progressMs) : '—'}</span>
          <span>{durationMs ? formatTime(durationMs) : '—'}</span>
        </div>
        {spotifyError && (
          <p className="relative z-10 mt-3 text-center text-[10px] text-red-200 bg-red-900/30 rounded px-2 py-1">{spotifyError}</p>
        )}
        <div className="relative z-10 mt-5 flex items-center justify-center gap-6">
          {isSpotifyConnected && (
            <button onClick={() => previous().catch(() => {})} className="text-white hover:text-white/80"><SkipBack size={20} fill="currentColor" /></button>
          )}
          <button onClick={() => handlePlayPause().catch(() => {})} disabled={!isSpotifyConnected} aria-label={isPlaying ? 'Pause Spotify' : 'Play Spotify'} className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#503b57] disabled:opacity-50" data-testid="button-music-play">
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-1" />}
          </button>
          {isSpotifyConnected && (
            <button onClick={() => next().catch(() => {})} className="text-white hover:text-white/80"><SkipForward size={20} fill="currentColor" /></button>
          )}
        </div>
        {isSpotifyConnected && playerState !== 'ready' && (
          <button onClick={() => connectPlayer().catch(() => {})} className="relative z-10 mt-4 w-full rounded-xl bg-white/20 py-2 text-xs font-medium text-white backdrop-blur flex items-center justify-center gap-2">
            <Smartphone size={14} /> {playerState === 'loading' ? 'Connecting Player…' : 'Connect Player'}
          </button>
        )}
      </div>

      <p className="mb-3 mt-7 text-[10px] uppercase tracking-[.2em] text-white/40">playlists</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setDetail({ kind: 'original-tracks', id: 'all' })} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left" data-testid="card-original-tracks">
          <span className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#39405b] to-[#718096]"><Music2 size={22} className="text-white/70" /></span>
          <p className="mt-3 text-sm">Original Tracks</p>
          <p className="mt-1 text-[10px] text-white/40">{((store as any).originalTracks || []).length} tracks</p>
        </button>
        {playlists.map((playlist, index) => {
          const songs = songsFor(playlist);
          return <button key={playlist.id} onClick={() => setDetail({ kind: 'playlist', id: playlist.id })} className="rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left" data-testid={`card-playlist-${index}`}>
            {playlist.artwork ? (
              <img src={playlist.artwork} className="flex h-14 w-full object-cover rounded-xl shadow" alt="" />
            ) : (
              <span className="flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br from-[#39405b] to-[#bc8998]"><Music2 size={22} className="text-white/70" /></span>
            )}
            <p className="mt-3 text-sm truncate">{playlist.name}</p>
            <p className="mt-1 text-[10px] text-white/40">{songs.length} songs</p>
          </button>;
        })}
      </div>
      {playlistError && <p role="alert" className="mt-4 text-xs text-red-200">{playlistError}</p>}

      {spotifyPlaylists.length > 0 && (
        <>
          <p className="mb-3 mt-7 text-[10px] uppercase tracking-[.2em] text-white/40">spotify</p>
          <div className="grid grid-cols-2 gap-3">
            {spotifyPlaylists.map(playlist => (
              <a key={playlist.id} href={playlist.externalUrl} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[.045] p-4 text-left" data-testid={`card-spotify-playlist-${playlist.id}`}>
                {playlist.artwork ? (
                  <img src={playlist.artwork} className="flex h-14 w-full object-cover rounded-xl shadow" alt="" />
                ) : (
                  <span className="flex h-14 w-full items-center justify-center rounded-xl bg-[#1DB954]/20"><Music2 size={22} className="text-[#1DB954]" /></span>
                )}
                <p className="mt-3 text-sm truncate">{playlist.name}</p>
                <p className="mt-1 text-[10px] text-white/40">{playlist.trackCount} songs</p>
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SpotifySearch({ onBack, commit, store }: { onBack: () => void; commit: any; store: PhoneStore }) {
  const [query, setQuery] = useState('');
  const { search, play, status } = useSpotify();
  const [results, setResults] = useState<SpotifySearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    if (!query.trim() || status?.status !== 'connected') {
      setResults(null);
      setIsSearching(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);
      search(query).then(res => {
        if (!cancelled) { setResults(res); setIsSearching(false); }
      }).catch(cause => {
        if (!cancelled) {
          setIsSearching(false);
          setResults(null);
          setSearchError(cause instanceof Error ? cause.message : 'Spotify search failed.');
        }
      });
    }, 500);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query, search, status?.status]);

  const addTrack = (track: SpotifyTrack) => {
    if (!commit) { setSearchError('This playlist cannot be edited right now.'); return; }
    const answer = window.prompt('Add to which playlist? (e.g. "night walks")', store.musicPlaylists?.[0]?.name || 'night walks');
    if (!answer) return;
    if (!store.musicPlaylists.some(p => p.name.toLowerCase() === answer.trim().toLowerCase())) {
      setSearchError('Choose a playlist name already on this phone.');
      return;
    }
    try {
      commit((s: PhoneStore) => ({
        ...s,
        musicPlaylists: s.musicPlaylists.map(p => p.name.toLowerCase() === answer.trim().toLowerCase()
          ? {
              ...p,
              songs: p.songs.some(song => song.toLowerCase() === track.name.toLowerCase()) ? p.songs : [...p.songs, track.name],
              spotifyTracks: p.spotifyTracks?.some(saved => saved.id === track.id) ? p.spotifyTracks : [...(p.spotifyTracks || []), track],
            }
          : p),
      }));
      setSearchError(null);
    } catch (cause) {
      setSearchError(cause instanceof Error ? cause.message : 'Could not save the track to this phone.');
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={onBack} className="rounded-full p-2 text-[#e5a9b3] hover:bg-white/10" data-testid="button-search-back"><ArrowLeft size={18} /></button>
        <div className="flex-1 rounded-2xl bg-white/10 px-4 py-2 flex items-center gap-2">
          <Search size={16} className="text-white/50" />
          <input 
            autoFocus
            value={query} 
            onChange={e => setQuery(e.target.value)} 
             placeholder="Search tracks, artists, albums..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-white/40 text-white"
          />
        </div>
      </div>
      
      {isSearching && <p className="text-center text-xs text-white/50 mt-10">Searching Spotify...</p>}
      {searchError && <p role="alert" className="mt-4 rounded-xl bg-red-900/30 p-3 text-xs text-red-200">{searchError}</p>}
      
      {!isSearching && results && (
        <div className="space-y-6 mt-6 pb-10">
          {results.tracks.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-[.2em] text-white/40 mb-3">Tracks</h3>
              <div className="space-y-1">
                 {results.tracks.slice(0, 10).map(track => (
                  <div key={track.id} className="flex items-center gap-3 rounded-xl p-2 hover:bg-white/10 group transition-colors">
                    {track.artwork ? (
                      <img src={track.artwork} className="h-10 w-10 rounded-md object-cover" alt="" />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5"><Music2 size={14} className="text-white/30" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{track.name}</p>
                      <p className="text-[10px] text-white/50 truncate">{track.artists.join(', ')}</p>
                    </div>
                    <button onClick={() => play(track).catch(() => {})} aria-label={`Play ${track.name}`} className="p-2 text-white/50 hover:text-white"><Play size={16} fill="currentColor" /></button>
                    <button onClick={() => addTrack(track)} aria-label={`Add ${track.name} to a playlist`} className="p-2 text-white/50 hover:text-white"><Plus size={16} /></button>
                    {track.externalUrl && <a href={track.externalUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open ${track.name} in Spotify`} className="p-2 text-white/50 hover:text-white"><ExternalLink size={15} /></a>}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {results.artists.length > 0 && (
            <div>
              <h3 className="text-[10px] uppercase tracking-[.2em] text-white/40 mb-3">Artists</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scroll-thin">
                 {results.artists.slice(0, 5).map(artist => (
                  <a key={artist.id} href={artist.externalUrl} target="_blank" rel="noreferrer" className="flex w-20 flex-col items-center gap-2 flex-shrink-0">
                    {artist.artwork ? (
                      <img src={artist.artwork} className="h-20 w-20 rounded-full object-cover shadow" alt="" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5 shadow"><Music2 size={24} className="text-white/30" /></div>
                    )}
                    <p className="text-[10px] text-center w-full truncate">{artist.name}</p>
                  </a>
                ))}
              </div>
            </div>
          )}
          {results.albums.length > 0 && (
            <div>
              <h3 className="mb-3 text-[10px] uppercase tracking-[.2em] text-white/40">Albums</h3>
              <div className="flex gap-4 overflow-x-auto pb-2 scroll-thin">
                {results.albums.slice(0, 8).map(album => (
                  <a key={album.id} href={album.externalUrl} target="_blank" rel="noopener noreferrer" className="flex w-24 flex-shrink-0 flex-col gap-2">
                    {album.artwork
                      ? <img src={album.artwork} className="h-24 w-24 rounded-xl object-cover shadow" alt="" />
                      : <span className="flex h-24 w-24 items-center justify-center rounded-xl bg-white/5"><Music2 size={24} className="text-white/30" /></span>}
                    <span className="truncate text-xs">{album.name}</span>
                    <span className="truncate text-[10px] text-white/50">{album.artists.join(', ')}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
