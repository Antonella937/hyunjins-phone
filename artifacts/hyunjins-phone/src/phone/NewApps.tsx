import React, { useState } from 'react';
import { PhoneStore, CallRecord, BrowserTab, EchoPost, StudioProject, Place, Contact } from './config';
import { 
  Phone as PhoneIcon, PhoneIncoming, Voicemail, History, Star, Search, Plus, 
  Trash2, ChevronRight, Compass, Bookmark, Clock, Globe, ArrowLeft,
  MessageSquareQuote, Heart, Repeat2, MessageCircle, BarChart2,
  AudioLines, Play, Pause, Mic2, Music, Upload,
  MapPin, Map, Navigation, User, Edit2, Download, Delete, RefreshCw, X, Hash, Bell,
  Clock3, Smartphone, FileText, Check
} from 'lucide-react';

export type Detail = { kind: string; id: string } | null;

export function SectionTitle({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h3 className="text-[10px] uppercase tracking-[.23em] text-white/45">{children}</h3>
      {action && (
        <button onClick={onAction} className="text-xs text-[#e7aabb] hover:text-white" data-testid={`button-${action.toLowerCase().replaceAll(' ', '-')}`}>
          {action}
        </button>
      )}
    </div>
  );
}

export function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span 
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-[#251e2b] ${size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-16 w-16 text-lg' : 'h-11 w-11 text-xs'}`} 
      style={{ background: `linear-gradient(145deg, ${color}, #f2d7bb)` }} 
      data-testid={`avatar-${initials}`}
    >
      {initials}
    </span>
  );
}

// Phone App
export function PhoneApp({ store, setStore, detail, setDetail, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; detail: Detail; setDetail: (d: Detail) => void; editMode: boolean }) {
  const [tab, setTab] = useState<'favorites' | 'recents' | 'contacts' | 'keypad' | 'voicemail'>('recents');
  const [calling, setCalling] = useState<CallRecord & { incoming?: boolean } | null>(null);
  const [keypadInput, setKeypadInput] = useState('');

  if (calling) {
    return (
      <div className="flex h-[75vh] flex-col items-center justify-between py-10">
        <div className="text-center">
          <p className="text-sm text-white/50">{calling.incoming ? 'Incoming Call...' : calling.missed ? 'Missed Call' : calling.type === 'voicemail' ? 'Voicemail' : 'calling...'}</p>
          <h1 className="mt-2 font-serif text-4xl">{calling.name || calling.number}</h1>
          <p className="mt-2 text-xs text-white/40">mobile</p>
        </div>
        {calling.type === 'voicemail' ? (
          <div className="flex w-full flex-col items-center gap-4">
            <div className="flex h-16 items-center gap-1 rounded-full bg-white/5 px-6">
              {Array.from({length: 20}).map((_, i) => (
                <span key={i} className="w-1 rounded-full bg-white/40" style={{ height: `${10 + (Math.sin(i * 123) * 40 + 40)}%` }} />
              ))}
            </div>
            <button onClick={() => setCalling(null)} className="rounded-full bg-red-500/20 px-8 py-3 text-red-400">close voicemail</button>
          </div>
        ) : (
          <div className="flex gap-10">
            <button onClick={() => { 
                if (calling.incoming) {
                  setStore(s => ({ ...s, calls: [{ ...calling, incoming: undefined, missed: true, duration: undefined }, ...s.calls] }));
                }
                setCalling(null);
              }} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg shadow-red-500/20">
              <PhoneIcon size={24} className="rotate-[135deg]" fill="currentColor" />
            </button>
            <button onClick={() => {
                if (calling.incoming) {
                  setCalling({ ...calling, incoming: false, duration: '0:01' });
                } else {
                  setCalling(null);
                }
              }} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white shadow-lg shadow-green-500/20">
              <PhoneIcon size={24} fill="currentColor" />
            </button>
          </div>
        )}
      </div>
    );
  }

  const deleteCall = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStore(s => ({ ...s, calls: s.calls.filter(c => c.id !== id) }));
  };

  const handleKeypadCall = () => {
    if (!keypadInput) return;
    const newCall = { id: `call-${Date.now()}`, number: keypadInput, time: 'now', type: 'audio' as const, duration: '0:00' };
    setStore(s => ({ ...s, calls: [newCall, ...s.calls] }));
    setCalling(newCall);
    setKeypadInput('');
  };

  const initiateCall = (c: any) => {
    const newCall = { id: `call-${Date.now()}`, name: c.name || c.number, time: 'now', type: 'audio' as const, duration: '0:00' };
    setStore(s => ({ ...s, calls: [newCall, ...s.calls] }));
    setCalling(newCall);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl">{tab.charAt(0).toUpperCase() + tab.slice(1)}</h1>
        {editMode && tab === 'recents' && (
          <button onClick={() => setCalling({ id: `call-${Date.now()}`, name: 'Unknown Caller', time: 'now', type: 'audio', incoming: true })} className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] text-white/50 hover:bg-white/20">
            Simulate Call
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {tab === 'favorites' && (
          <div className="grid grid-cols-2 gap-3">
            {store.contacts.filter(c => c.role.includes('favorite')).map(c => (
              <button key={c.id} onClick={() => initiateCall(c)} className="flex flex-col items-center justify-center rounded-2xl bg-white/5 p-4 text-center hover:bg-white/10">
                <Avatar initials={c.initials} color={c.color} size="lg" />
                <h3 className="mt-3 text-sm font-medium">{c.name}</h3>
                <p className="mt-1 text-[10px] text-white/40">{c.role}</p>
              </button>
            ))}
          </div>
        )}

        {tab === 'contacts' && (
          <div className="space-y-2">
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/40">
              <Search size={15} /> search contacts
            </div>
            {store.contacts.map(c => (
              <button key={c.id} onClick={() => initiateCall(c)} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-3 text-left hover:bg-white/[.08]">
                <Avatar initials={c.initials} color={c.color} />
                <span className="flex-1">
                  <b className="block text-sm">{c.name}</b>
                  <small className="mt-1 block text-[10px] text-white/40">{c.role}</small>
                </span>
                <PhoneIcon size={15} className="text-white/25" />
              </button>
            ))}
          </div>
        )}

        {tab === 'recents' && (
          <div className="space-y-4">
            {store.calls.map(c => (
              <div key={c.id} onClick={() => setCalling(c)} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div>
                  <h3 className={`font-medium ${c.missed ? 'text-red-400' : 'text-white'}`}>{c.name || c.number}</h3>
                  <p className="mt-1 text-xs text-white/50">{c.type} {c.duration ? `· ${c.duration}` : ''}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">{c.time}</span>
                  {editMode && <button onClick={(e) => deleteCall(c.id, e)} className="text-white/30 hover:text-red-400"><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {tab === 'voicemail' && (
          <div className="space-y-4">
            {store.calls.filter(c => c.type === 'voicemail').map(c => (
              <div key={c.id} onClick={() => setCalling(c)} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/5 p-4 hover:bg-white/10">
                <div className="flex items-center gap-3">
                  <Voicemail size={20} className="text-[#a4c9b3]" />
                  <div>
                    <h3 className="font-medium">{c.name || c.number}</h3>
                    <p className="mt-1 text-xs text-white/50">{c.time} · {c.duration}</p>
                  </div>
                </div>
                <Play size={20} className="text-white/50" fill="currentColor" />
              </div>
            ))}
          </div>
        )}

        {tab === 'keypad' && (
          <div className="flex h-full flex-col items-center justify-center pb-10">
            <h2 className="mb-10 text-3xl font-light text-white/50 min-h-[40px]">{keypadInput || 'Enter number'}</h2>
            <div className="grid grid-cols-3 gap-6">
              {['1','2','3','4','5','6','7','8','9','*','0','#'].map(k => (
                <button key={k} onClick={() => setKeypadInput(prev => prev + k)} className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-2xl font-light hover:bg-white/20 active:bg-white/30">{k}</button>
              ))}
            </div>
            <div className="mt-10 flex gap-6">
              <button onClick={handleKeypadCall} className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500 text-white hover:bg-green-400"><PhoneIcon size={24} fill="currentColor" /></button>
              {keypadInput && <button onClick={() => setKeypadInput(prev => prev.slice(0, -1))} className="flex h-16 w-16 items-center justify-center rounded-full text-white/50 hover:text-white"><Delete size={24} /></button>}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-[10px] text-white/50">
        <button onClick={() => setTab('favorites')} className={`flex flex-col items-center gap-1 ${tab === 'favorites' ? 'text-[#8eb093]' : ''}`}><Star size={20} />Favorites</button>
        <button onClick={() => setTab('recents')} className={`flex flex-col items-center gap-1 ${tab === 'recents' ? 'text-[#8eb093]' : ''}`}><History size={20} />Recents</button>
        <button onClick={() => setTab('contacts')} className={`flex flex-col items-center gap-1 ${tab === 'contacts' ? 'text-[#8eb093]' : ''}`}><PhoneIncoming size={20} />Contacts</button>
        <button onClick={() => setTab('keypad')} className={`flex flex-col items-center gap-1 ${tab === 'keypad' ? 'text-[#8eb093]' : ''}`}><Hash size={20} />Keypad</button>
        <button onClick={() => setTab('voicemail')} className={`flex flex-col items-center gap-1 ${tab === 'voicemail' ? 'text-[#8eb093]' : ''}`}><Voicemail size={20} />Voicemail</button>
      </div>
    </div>
  );
}

// Browser App
export function BrowserApp({ store, setStore, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; editMode: boolean }) {
  const [tab, setTab] = useState<'tabs' | 'history' | 'bookmarks' | 'downloads' | 'recent'>('tabs');
  const [isPrivate, setIsPrivate] = useState(false);
  const [url, setUrl] = useState('');

  const addTab = () => {
    if (!url) return;
    setStore(s => ({
      ...s,
      browserTabs: [{ id: `bt-${Date.now()}`, url, title: url, active: true, private: isPrivate }, ...s.browserTabs.map(t => ({...t, active: false}))],
      browserHistory: isPrivate ? s.browserHistory : [{ id: `bh-${Date.now()}`, url, title: url, time: 'just now' }, ...s.browserHistory]
    }));
    setUrl('');
  };

  const filteredTabs = store.browserTabs.filter(t => !!t.private === isPrivate);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl">Browser</h1>
        {tab === 'tabs' && (
          <button onClick={() => setIsPrivate(!isPrivate)} className={`rounded-xl px-3 py-1.5 text-[10px] uppercase tracking-wider ${isPrivate ? 'bg-[#7ba1b9] text-[#12111d]' : 'border border-white/20 text-white/50'}`}>
            {isPrivate ? 'Private' : 'Standard'}
          </button>
        )}
      </div>
      
      <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
        <Search size={16} className="text-white/40" />
        <input 
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addTab()}
          placeholder="Search or enter address"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {tab === 'tabs' && (
          <div className="grid grid-cols-2 gap-3">
            {filteredTabs.map(t => (
              <div key={t.id} className={`relative flex h-32 flex-col justify-between rounded-2xl border p-4 ${t.active ? 'border-[#7ba1b9] bg-[#7ba1b9]/10' : 'border-white/10 bg-white/5'}`}>
                <p className="line-clamp-2 text-sm">{t.title}</p>
                <div className="flex items-center justify-between">
                  <p className="w-24 truncate text-[10px] text-white/40">{t.url}</p>
                  <button onClick={() => setStore(s => ({...s, browserTabs: s.browserTabs.filter(x => x.id !== t.id)}))} className="text-white/30 hover:text-red-400"><X size={14} /></button>
                </div>
              </div>
            ))}
            <button className="flex h-32 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 text-white/40 hover:bg-white/5">
              <Plus size={24} className="mb-2" />
              <span className="text-xs">New Tab</span>
            </button>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-4">
            {store.browserHistory.map(h => (
              <div key={h.id} className="flex items-center justify-between rounded-xl p-2 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <Globe size={18} className="text-white/30" />
                  <div>
                    <p className="text-sm">{h.title}</p>
                    <p className="text-[10px] text-white/40">{h.url}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-white/30">{h.time}</span>
                  {editMode && <button onClick={() => setStore(s => ({...s, browserHistory: s.browserHistory.filter(x => x.id !== h.id)}))} className="text-white/30 hover:text-red-400"><Trash2 size={14} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'bookmarks' && (
          <div className="space-y-4">
            {store.browserBookmarks.map(b => (
              <div key={b.id} className="flex items-center justify-between rounded-xl p-2 hover:bg-white/5">
                <div className="flex items-center gap-3">
                  <Bookmark size={18} className="text-[#7ba1b9]" />
                  <div>
                    <p className="text-sm">{b.title}</p>
                    <p className="text-[10px] text-white/40">{b.url}</p>
                  </div>
                </div>
                {editMode && <button onClick={() => setStore(s => ({...s, browserBookmarks: s.browserBookmarks.filter(x => x.id !== b.id)}))} className="text-white/30 hover:text-red-400"><Trash2 size={14} /></button>}
              </div>
            ))}
          </div>
        )}

        {tab === 'downloads' && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
            <Download size={40} className="mb-4 text-[#7ba1b9]/50" />
            <p className="text-sm">No recent downloads</p>
          </div>
        )}
        
        {tab === 'recent' && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
            <RefreshCw size={40} className="mb-4 text-[#7ba1b9]/50" />
            <p className="text-sm">No recently closed tabs</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-[10px] text-white/50">
        <button onClick={() => setTab('tabs')} className={`flex flex-col items-center gap-1 ${tab === 'tabs' ? 'text-[#7ba1b9]' : ''}`}><Compass size={20} />Tabs</button>
        <button onClick={() => setTab('bookmarks')} className={`flex flex-col items-center gap-1 ${tab === 'bookmarks' ? 'text-[#7ba1b9]' : ''}`}><Bookmark size={20} />Bookmarks</button>
        <button onClick={() => setTab('history')} className={`flex flex-col items-center gap-1 ${tab === 'history' ? 'text-[#7ba1b9]' : ''}`}><Clock size={20} />History</button>
        <button onClick={() => setTab('recent')} className={`flex flex-col items-center gap-1 ${tab === 'recent' ? 'text-[#7ba1b9]' : ''}`}><RefreshCw size={20} />Closed</button>
        <button onClick={() => setTab('downloads')} className={`flex flex-col items-center gap-1 ${tab === 'downloads' ? 'text-[#7ba1b9]' : ''}`}><Download size={20} />Files</button>
      </div>
    </div>
  );
}

// Echo App (Microblogging)
export function EchoApp({ store, setStore, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; editMode: boolean }) {
  const [tab, setTab] = useState<'timeline' | 'profile' | 'search' | 'activity' | 'bookmarks'>('timeline');

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl">Echo</h1>
        <button className="rounded-full bg-[#a293b6] p-2 text-black"><Plus size={18} /></button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-16">
        {tab === 'timeline' && (
          <div className="space-y-5 border-l-2 border-white/10 pl-4">
            {store.echoPosts.map(p => (
              <div key={p.id} className="relative pb-4">
                <div className="absolute -left-[27px] top-0 rounded-full border-4 border-[#12111d] bg-[#12111d]">
                  <Avatar initials={p.author[0].toUpperCase()} color={p.author === 'hyune' ? '#a293b6' : '#8fa8c0'} size="sm" />
                </div>
                <div className="mb-1 flex items-baseline gap-2">
                  <span className="font-semibold">{p.author}</span>
                  <span className="text-[10px] text-white/40">{p.handle} · {p.time}</span>
                  {p.isReposted && <span className="text-[10px] text-[#a293b6]"><Repeat2 size={10} className="inline mr-1" />reposted</span>}
                </div>
                <p className="text-sm leading-6 text-white/80">{p.content}</p>
                <div className="mt-3 flex gap-6 text-xs text-white/40">
                  <button className="flex items-center gap-1.5 hover:text-[#a293b6]"><MessageCircle size={14} />{p.replies}</button>
                  <button className="flex items-center gap-1.5 hover:text-[#a293b6]"><Repeat2 size={14} />{p.reposts}</button>
                  <button className="flex items-center gap-1.5 hover:text-[#a293b6]"><Heart size={14} />{p.likes}</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'profile' && (
          <div>
            <div className="flex flex-col items-center border-b border-white/10 pb-6 text-center">
              <Avatar initials="H" color="#a293b6" size="lg" />
              <h2 className="mt-4 font-serif text-3xl">hyune</h2>
              <p className="mt-1 text-xs text-white/40">@hyune</p>
              <p className="mt-4 max-w-[200px] text-sm text-white/70">small evidence of a life in motion.</p>
              <div className="mt-4 flex gap-6 text-xs">
                <span><b className="text-white">128</b> following</span>
                <span><b className="text-white">14.2k</b> followers</span>
              </div>
            </div>
            <div className="mt-6 space-y-5 border-l-2 border-white/10 pl-4">
              {store.echoPosts.filter(p => p.author === 'hyune').map(p => (
                <div key={p.id} className="relative pb-4">
                  <div className="absolute -left-[27px] top-0 rounded-full border-4 border-[#12111d] bg-[#12111d]">
                    <Avatar initials="H" color="#a293b6" size="sm" />
                  </div>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-semibold">{p.author}</span>
                    <span className="text-[10px] text-white/40">{p.handle} · {p.time}</span>
                  </div>
                  <p className="text-sm leading-6 text-white/80">{p.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {tab === 'activity' && (
          <div className="space-y-4">
            {store.echoNotifications.map(n => (
              <div key={n.id} className="flex gap-4 rounded-xl border border-white/5 bg-white/[.02] p-4">
                <span className="text-[#a293b6]">
                  {n.type === 'like' ? <Heart size={20} fill="currentColor" /> : n.type === 'reply' ? <MessageCircle size={20} fill="currentColor" /> : <Repeat2 size={20} />}
                </span>
                <div>
                  <p className="text-sm"><span className="font-semibold">{n.user}</span> {n.text}</p>
                  <p className="mt-1 text-[10px] text-white/40">{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'search' && (
          <div>
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Search size={16} className="text-white/40" />
              <input placeholder="Search Echo" className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40" />
            </div>
            <SectionTitle>Trends</SectionTitle>
            <div className="space-y-4">
              {['#midnightwalk', 'Seoul Rain', 'Studio Nights', 'Analog Film'].map((t, i) => (
                <div key={t} className="flex justify-between border-b border-white/5 pb-4">
                  <div>
                    <p className="text-[10px] text-white/40">{i + 1} · Trending</p>
                    <p className="mt-1 font-medium">{t}</p>
                    <p className="mt-1 text-[10px] text-white/40">{Math.floor(Math.random() * 10) + 1}k echoes</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'bookmarks' && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
            <Bookmark size={40} className="mb-4 text-[#a293b6]/50" />
            <p className="text-sm">No saved echoes yet</p>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-[10px] text-white/50">
        <button onClick={() => setTab('timeline')} className={`flex flex-col items-center gap-1 ${tab === 'timeline' ? 'text-[#a293b6]' : ''}`}><MessageSquareQuote size={20} />Home</button>
        <button onClick={() => setTab('search')} className={`flex flex-col items-center gap-1 ${tab === 'search' ? 'text-[#a293b6]' : ''}`}><Search size={20} />Search</button>
        <button onClick={() => setTab('activity')} className={`flex flex-col items-center gap-1 ${tab === 'activity' ? 'text-[#a293b6]' : ''}`}><Bell size={20} />Activity</button>
        <button onClick={() => setTab('bookmarks')} className={`flex flex-col items-center gap-1 ${tab === 'bookmarks' ? 'text-[#a293b6]' : ''}`}><Bookmark size={20} />Saved</button>
        <button onClick={() => setTab('profile')} className={`flex flex-col items-center gap-1 ${tab === 'profile' ? 'text-[#a293b6]' : ''}`}><User size={20} />Profile</button>
      </div>
    </div>
  );
}

// Studio App
export function StudioApp({ store, setStore, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; editMode: boolean }) {
  const [tab, setTab] = useState<'projects' | 'lyrics' | 'voice'>('projects');
  const [filter, setFilter] = useState<'all' | 'demo' | 'unfinished' | 'finished'>('all');

  const filteredProjects = store.studioProjects.filter(p => filter === 'all' || p.status === filter);

  const handleManualAudioUpload = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStore(s => ({
      ...s,
      studioProjects: s.studioProjects.map(p => p.id === id ? { ...p, hasAudio: true, metadata: `${p.metadata} · manual upload`, duration: '0:01' } : p)
    }));
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-xs text-white/45">work in progress</p>
          <h1 className="mt-1 font-serif text-4xl">Studio</h1>
        </div>
        <button className="rounded-full bg-[#bba78d] p-3 text-[#2b1d27]">
          <Plus size={17} />
        </button>
      </div>

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-4">
        {['projects', 'lyrics', 'voice'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} className={`shrink-0 rounded-full border px-4 py-1.5 text-xs capitalize ${tab === t ? 'border-[#bba78d] bg-[#bba78d]/10 text-[#bba78d]' : 'border-white/10 text-white/50'}`}>
            {t}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto pb-10">
        {tab === 'projects' && (
          <>
            <div className="mb-6 rounded-3xl border border-[#bba78d]/20 bg-[#bba78d]/10 p-5">
              <div className="flex items-center gap-3">
                <AudioLines size={24} className="text-[#bba78d]" />
                <div>
                  <h3 className="font-medium text-[#dfcaae]">AI Music Provider Not Connected</h3>
                  <p className="text-[10px] text-white/60">Manual audio upload available for projects.</p>
                </div>
              </div>
            </div>

            <div className="mb-4 flex gap-2">
              {['all', 'demo', 'unfinished', 'finished'].map(f => (
                <button key={f} onClick={() => setFilter(f as any)} className={`text-[10px] uppercase tracking-wider ${filter === f ? 'text-white' : 'text-white/40 hover:text-white/70'}`}>
                  {f}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {filteredProjects.map(p => (
                <div key={p.id} className="flex items-start gap-4 rounded-3xl border border-white/10 bg-white/[.045] p-5">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2f2a24] to-[#716353] text-[#e0cbb2]">
                    {p.hasAudio ? <Music size={20} /> : <Mic2 size={20} />}
                  </span>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h3 className="font-serif text-lg">{p.title}</h3>
                      <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] text-white/40">{p.status}</span>
                    </div>
                    <p className="mt-1 text-[10px] text-white/40">{p.updated} · {p.duration}</p>
                    <p className="mt-2 text-xs text-white/60">{p.metadata}</p>
                    <div className="mt-4 flex gap-2">
                      <button className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] ${p.hasAudio ? 'bg-white/10 text-white' : 'bg-white/5 text-white/30'}`}><Play size={12} fill="currentColor" /> Play</button>
                      {editMode && (
                        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-[10px] hover:bg-white/5">
                          <Upload size={12} /> Upload Audio
                          <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleManualAudioUpload(e, p.id)} />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'lyrics' && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
            <FileText size={40} className="mb-4 text-[#bba78d]/50" />
            <p className="text-sm">Check Notes app for lyric fragments.</p>
          </div>
        )}

        {tab === 'voice' && (
          <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
            <Mic2 size={40} className="mb-4 text-[#bba78d]/50" />
            <p className="text-sm">Check Voice Memos for recordings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Places App
export function PlacesApp({ store, setStore, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; editMode: boolean }) {
  return (
    <div>
      <div className="mb-7 flex items-end justify-between">
        <div>
          <p className="text-xs text-white/45">saved locations</p>
          <h1 className="mt-1 font-serif text-4xl">Places</h1>
        </div>
        <button className="rounded-full bg-[#c49582] p-3 text-black"><Plus size={17} /></button>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3">
        {['cafés', 'restaurants', 'art', 'music'].map(c => (
          <button key={c} className="rounded-xl border border-white/10 bg-white/5 py-3 text-center text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white">
            {c}
          </button>
        ))}
      </div>

      <SectionTitle>recent & saved</SectionTitle>
      <div className="space-y-3">
        {store.places.map(p => (
          <div key={p.id} className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[.045] p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c49582]/20 text-[#dbb09f]">
              <MapPin size={18} />
            </span>
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">{p.name}</h3>
                <Star size={16} className={p.saved ? 'text-[#c49582]' : 'text-white/20'} fill={p.saved ? 'currentColor' : 'none'} />
              </div>
              <p className="mt-1 text-[10px] text-white/50">{p.location} · {p.category}</p>
              {p.notes && <p className="mt-2 text-xs leading-5 text-white/70">"{p.notes}"</p>}
              <button className="mt-3 flex items-center gap-1 text-[10px] text-[#c49582]"><Navigation size={12} /> directions</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Screen Time App
export function ScreenTimeApp({ store }: { store: PhoneStore }) {
  // Derive stats deterministically
  const totalCalls = store.calls.length;
  const totalMessages = store.messages.reduce((acc, m) => acc + m.messages.length, 0);
  const totalBrowser = store.browserHistory.length;
  const totalPosts = store.echoPosts.length;
  const totalMinutes = totalCalls * 5 + totalMessages * 2 + totalBrowser * 3 + totalPosts * 10;
  
  const h = Math.floor(totalMinutes / 60) || 4;
  const m = totalMinutes % 60 || 12;
  const pickups = Math.max(12, totalCalls + totalMessages + totalPosts);

  const mostContacted = store.messages[0]?.person || 'Unknown';

  return (
    <div>
      <div className="mb-7">
        <p className="text-xs text-white/45">today's activity</p>
        <h1 className="mt-1 font-serif text-4xl">Screen Time</h1>
      </div>

      <div className="mb-8 flex flex-col items-center justify-center rounded-3xl bg-gradient-to-b from-[#858faf]/20 to-transparent py-10">
        <h2 className="font-serif text-5xl">{h}h {m}m</h2>
        <p className="mt-2 text-xs text-white/50">14% down from last week</p>
      </div>

      <SectionTitle>most used apps</SectionTitle>
      <div className="space-y-4 rounded-3xl border border-white/10 bg-white/[.045] p-5">
        <div className="flex items-center gap-4">
          <MessageCircle size={20} className="text-[#7b9bb9]" />
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span>Messages</span><span>{Math.max(1, Math.floor(h * 0.4))}h {Math.max(15, m + 10)}m</span></div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10"><div className="h-full w-[45%] rounded-full bg-[#7b9bb9]"></div></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Compass size={20} className="text-[#7ba1b9]" />
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span>Browser</span><span>{Math.max(0, Math.floor(h * 0.3))}h {Math.max(10, m - 5)}m</span></div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10"><div className="h-full w-[35%] rounded-full bg-[#7ba1b9]"></div></div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <MessageSquareQuote size={20} className="text-[#a293b6]" />
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span>Echo</span><span>42m</span></div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-white/10"><div className="h-full w-[20%] rounded-full bg-[#a293b6]"></div></div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <Smartphone size={20} className="mb-3 text-white/40" />
          <p className="text-2xl font-medium">{pickups}</p>
          <p className="text-[10px] text-white/50">Pickups today</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <MessageCircle size={20} className="mb-3 text-[#d895a6]" />
          <p className="truncate text-lg font-medium">{mostContacted}</p>
          <p className="text-[10px] text-white/50">Most Contacted</p>
        </div>
      </div>
    </div>
  );
}
