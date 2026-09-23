import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type SpotifyTrack = {
  id: string; uri: string; name: string; artists: string[]; album: string;
  artwork: string | null; durationMs: number; externalUrl: string;
};
export type SpotifyDevice = { id: string; name: string; type: string; isActive: boolean; isRestricted: boolean };
export type SpotifyStatus = {
  configured: boolean;
  status: 'not_configured' | 'ready_to_connect' | 'connected' | 'authentication_expired';
  account?: { id: string; displayName: string; product: string };
  redirectUri: string; productionRedirectUri: string | null;
};
export type SpotifyPlayback = {
  isPlaying: boolean; progressMs: number; track: SpotifyTrack | null; device: SpotifyDevice | null;
};
export type SpotifySearchResults = {
  tracks: SpotifyTrack[];
  artists: Array<{ id: string; name: string; artwork: string | null; externalUrl: string; uri: string }>;
  albums: Array<{ id: string; name: string; artists: string[]; artwork: string | null; externalUrl: string; uri: string }>;
};
export type SpotifyPlaylistSummary = {
  id: string; name: string; artwork: string | null; trackCount: number; externalUrl: string;
};
type PlayerState = 'idle' | 'loading' | 'ready' | 'unavailable' | 'activation_required';

type SpotifyPlayer = {
  connect(): Promise<boolean>;
  disconnect(): void;
  activateElement(): Promise<void>;
  addListener(event: string, callback: (data: any) => void): boolean;
};
declare global {
  interface Window {
    Spotify?: {
      Player: new (options: { name: string; getOAuthToken: (callback: (token: string) => void) => void; volume: number }) => SpotifyPlayer;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let sdkLoad: Promise<void> | undefined;
function loadSdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  if (!sdkLoad) {
    sdkLoad = new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('Spotify player did not load. Check your connection or content blocker.')), 15000);
      const previous = window.onSpotifyWebPlaybackSDKReady;
      window.onSpotifyWebPlaybackSDKReady = () => {
        window.clearTimeout(timer);
        previous?.();
        resolve();
      };
      const script = document.createElement('script');
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timer);
        reject(new Error('Spotify player could not load. Check your network or content blocker.'));
      };
      document.head.appendChild(script);
    }).catch(error => { sdkLoad = undefined; throw error; });
  }
  return sdkLoad!;
}

async function api<T>(path: string, method = 'GET', body?: object): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/spotify${path}`, {
      method, credentials: 'same-origin', cache: 'no-store',
      ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
    });
  } catch {
    throw new Error('Could not reach Spotify through the phone. Check your connection and try again.');
  }
  if (response.status === 204) return null as T;
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(typeof result?.error === 'string' ? result.error : `Spotify request failed (${response.status}).`);
  return result as T;
}

type SpotifyContextValue = {
  status: SpotifyStatus | null; playback: SpotifyPlayback | null; devices: SpotifyDevice[];
  playerState: PlayerState; deviceId: string | null; error: string | null;
  connect: () => void; disconnect: () => Promise<void>; connectPlayer: () => Promise<void>;
  play: (track?: SpotifyTrack) => Promise<void>; pause: () => Promise<void>;
  next: () => Promise<void>; previous: () => Promise<void>; seek: (positionMs: number) => Promise<void>;
  transfer: (deviceId: string) => Promise<void>;
  search: (query: string) => Promise<SpotifySearchResults>;
  loadSpotifyPlaylists: () => Promise<SpotifyPlaylistSummary[]>;
  reloadPlayback: () => Promise<void>; dismissError: () => void;
};
const SpotifyContext = createContext<SpotifyContextValue | null>(null);

export function useSpotify(): SpotifyContextValue {
  const context = useContext(SpotifyContext);
  if (!context) throw new Error('The Spotify player is not available outside the phone.');
  return context;
}

export function SpotifyProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SpotifyStatus | null>(null);
  const [playback, setPlayback] = useState<SpotifyPlayback | null>(null);
  const [devices, setDevices] = useState<SpotifyDevice[]>([]);
  const [playerState, setPlayerState] = useState<PlayerState>('idle');
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const player = useRef<SpotifyPlayer | null>(null);
  const liveDeviceId = useRef<string | null>(null);
  const preferredDeviceId = useRef<string | null>(null);
  const readyWaiter = useRef<((id: string) => void) | null>(null);

  const reloadStatus = useCallback(async () => {
    try {
      const next = await api<SpotifyStatus>('/status');
      setStatus(next);
      if (next.status !== 'connected') {
        setPlayback(null);
        setDevices([]);
        player.current?.disconnect();
        player.current = null;
        liveDeviceId.current = null;
        preferredDeviceId.current = null;
        setDeviceId(null);
        setPlayerState('idle');
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Spotify connection status could not load.');
    }
  }, []);

  const reloadPlayback = useCallback(async () => {
    try {
      const next = await api<SpotifyPlayback | null>('/playback');
      setPlayback(next);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Spotify playback could not load.';
      if (/authentication expired/i.test(message)) void reloadStatus();
      setError(message);
    }
  }, [reloadStatus]);

  const reloadDevices = useCallback(async () => {
    try {
      const result = await api<{ devices: SpotifyDevice[] }>('/devices');
      setDevices(result.devices);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Spotify devices could not load.');
    }
  }, []);

  useEffect(() => { void reloadStatus(); }, [reloadStatus]);
  useEffect(() => {
    if (status?.status !== 'connected') return;
    void reloadPlayback();
    void reloadDevices();
    void loadSdk().catch(cause => {
      setPlayerState('unavailable');
      setError(cause instanceof Error ? cause.message : 'Spotify browser player could not load.');
    });
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void reloadPlayback();
    }, 3000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') { void reloadStatus(); void reloadPlayback(); void reloadDevices(); }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisible); };
  }, [status?.status, reloadPlayback, reloadDevices, reloadStatus]);
  useEffect(() => () => { player.current?.disconnect(); }, []);

  const activatePlayer = async (): Promise<string> => {
    if (status?.status !== 'connected') throw new Error('Connect your Spotify account in Settings → Music → Spotify first.');
    if (!window.Spotify) {
      void loadSdk().catch(cause => setError(cause instanceof Error ? cause.message : 'Spotify player could not load.'));
      setPlayerState('activation_required');
      throw new Error('Spotify player is loading. Tap Connect Player again to activate audio on this device.');
    }
    if (!player.current) {
      const instance = new window.Spotify.Player({
        name: 'Hyunjin’s Phone', volume: 0.7,
        getOAuthToken: callback => {
          void api<{ accessToken: string }>('/token').then(result => callback(result.accessToken)).catch(cause => {
            setPlayerState('unavailable');
            setError(cause instanceof Error ? cause.message : 'Spotify authorization expired.');
          });
        },
      });
      instance.addListener('ready', (data: { device_id: string }) => {
        liveDeviceId.current = data.device_id;
        setDeviceId(data.device_id);
        setPlayerState('ready');
        readyWaiter.current?.(data.device_id);
        readyWaiter.current = null;
        void reloadDevices();
      });
      instance.addListener('not_ready', () => {
        liveDeviceId.current = null;
        setDeviceId(null);
        setPlayerState('unavailable');
        setError('Spotify playback device is unavailable. Check your network and reconnect the player.');
      });
      for (const event of ['initialization_error', 'authentication_error', 'account_error', 'playback_error']) {
        instance.addListener(event, (data: { message?: string }) => {
          setPlayerState('unavailable');
          setError(data.message || `Spotify ${event.replace('_', ' ')}.`);
        });
      }
      instance.addListener('autoplay_failed', () => {
        setPlayerState('activation_required');
        setError('Your browser blocked automatic audio. Tap Play or Connect Player to activate playback.');
      });
      instance.addListener('player_state_changed', () => { void reloadPlayback(); });
      player.current = instance;
    }
    // Must be invoked synchronously from the click event before the first await (iOS).
    void player.current.activateElement().catch(cause => {
      setPlayerState('activation_required');
      setError(cause instanceof Error ? cause.message : 'Tap Play again to activate audio in this browser.');
    });
    if (liveDeviceId.current) return liveDeviceId.current;
    setPlayerState('loading');
    let timeout = 0;
    const ready = new Promise<string>((resolve, reject) => {
      timeout = window.setTimeout(() => {
        readyWaiter.current = null;
        setPlayerState('unavailable');
        reject(new Error('Spotify playback device did not become ready. Try Connect Player again.'));
      }, 12000);
      readyWaiter.current = id => { window.clearTimeout(timeout); resolve(id); };
    });
    let connected: boolean;
    try { connected = await player.current.connect(); }
    catch (cause) {
      window.clearTimeout(timeout);
      readyWaiter.current = null;
      throw cause;
    }
    if (!connected) {
      window.clearTimeout(timeout);
      readyWaiter.current = null;
      setPlayerState('unavailable');
      throw new Error('Spotify player could not connect. Premium and an active internet connection are required.');
    }
    return ready;
  };

  const run = async (action: () => Promise<void>) => {
    setError(null);
    try { await action(); }
    catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Spotify could not complete this action.';
      setError(message);
      throw cause;
    }
  };
  const connectPlayer = () => run(async () => { await activatePlayer(); });
  const play = (track?: SpotifyTrack) => run(async () => {
    const selected = preferredDeviceId.current;
    // A device selected explicitly in the selector stays selected until the user changes it.
    const id = selected && selected !== liveDeviceId.current ? selected : await activatePlayer();
    await api('/play', 'PUT', { deviceId: id, ...(track ? { uri: track.uri } : {}) });
    await reloadPlayback();
  });
  const pause = () => run(async () => { await api('/pause', 'PUT'); await reloadPlayback(); });
  const next = () => run(async () => { await api('/next', 'POST'); await reloadPlayback(); });
  const previous = () => run(async () => { await api('/previous', 'POST'); await reloadPlayback(); });
  const seek = (positionMs: number) => run(async () => {
    await api('/seek', 'PUT', { positionMs: Math.max(0, Math.round(positionMs)) });
    await reloadPlayback();
  });
  const transfer = (id: string) => run(async () => {
    if (id === liveDeviceId.current && player.current) void player.current.activateElement();
    await api('/transfer', 'PUT', { deviceId: id });
    preferredDeviceId.current = id;
    await reloadDevices();
    await reloadPlayback();
  });
  const disconnect = () => run(async () => {
    await api('/disconnect', 'POST');
    player.current?.disconnect();
    player.current = null;
    liveDeviceId.current = null;
    preferredDeviceId.current = null;
    setDeviceId(null);
    setPlayerState('idle');
    setPlayback(null);
    setDevices([]);
    await reloadStatus();
  });
  const search = useCallback((query: string) => api<SpotifySearchResults>(`/search?q=${encodeURIComponent(query)}`), []);
  const loadSpotifyPlaylists = useCallback(async () =>
    (await api<{ playlists: SpotifyPlaylistSummary[] }>('/playlists')).playlists, []);
  const connect = () => { window.location.assign('/api/spotify/connect'); };

  return <SpotifyContext.Provider value={{
    status, playback, devices, playerState, deviceId, error, connect, disconnect, connectPlayer, play, pause, next,
    previous, seek, transfer, search, loadSpotifyPlaylists, reloadPlayback, dismissError: () => setError(null),
  }}>{children}</SpotifyContext.Provider>;
}