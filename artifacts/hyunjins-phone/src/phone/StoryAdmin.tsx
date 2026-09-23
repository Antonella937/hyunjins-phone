import React, { useState, useEffect } from 'react';
import { PhoneStore, Canon, seedCanon } from './config';
import { X, Server, RefreshCw, Send, CheckCircle2, Trash2, Edit2, Check, Image as ImageIcon } from 'lucide-react';
import { useGetStoryProviders, useGenerateStoryActivity, useGenerateStoryImage, ActivityProposal, ActivityProposalApp } from '@workspace/api-client-react';

export function StoryAdmin({ store, setStore, onClose }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; onClose: () => void }) {
  const [tab, setTab] = useState<'update' | 'proposals' | 'canon'>('update');
  const [storyUpdate, setStoryUpdate] = useState('');
  const [mode, setMode] = useState<'story_update' | 'generate_day'>('story_update');
  const [imagePrompt, setImagePrompt] = useState('');

  const { data: providers, isLoading: providersLoading } = useGetStoryProviders();
  const generateActivity = useGenerateStoryActivity();
  const generateImage = useGenerateStoryImage();

  const [proposals, setProposals] = useState<any[]>([]);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Handle Canon updates
  const handleCanonChange = (key: keyof Canon, value: string) => {
    setStore(s => ({ ...s, canon: { ...s.canon, [key]: value } }));
  };

  const submitUpdate = async () => {
    if (!storyUpdate.trim()) return;
    
    // Create compact phone summary
    const summary = {
      recentMessages: store.messages.slice(0,3).map(m => ({ to: m.person, text: m.messages[m.messages.length-1]?.text })),
      recentDiary: store.diary.slice(0,1),
      recentEvents: store.events.slice(0,2)
    };

    generateActivity.mutate({
      data: {
        storyUpdate,
        mode,
        canon: store.canon || seedCanon,
        existingPhone: summary
      }
    }, {
      onSuccess: (data) => {
        setProposals(data.proposals);
        setApprovedIds(new Set(data.proposals.map((p: any) => p.id)));
        setTab('proposals');
      }
    });
  };

  const publishApproved = () => {
    const toPublish = proposals.filter(p => approvedIds.has(p.id));
    
    setStore(s => {
      const draft: PhoneStore = JSON.parse(JSON.stringify(s));
      toPublish.forEach(p => {
        const id = `gen-${Date.now()}-${p.id}`;
        switch (p.app) {
          case 'messages':
            const msgThread = draft.messages.find(m => m.person.toLowerCase().includes(p.person?.toLowerCase() || ''));
            if (msgThread) {
              msgThread.messages.push({ from: 'them', text: p.content, time: 'now' });
            } else {
              draft.messages.unshift({ id, person: p.person || 'Unknown', initials: 'U', preview: p.content, time: 'now', color: '#888', messages: [{ from: 'them', text: p.content, time: 'now' }] });
            }
            break;
          case 'diary':
            draft.diary.unshift({ id, date: 'Today', title: p.title, mood: p.metadata?.mood || 'reflective', body: p.content });
            break;
          case 'echo':
            draft.echoPosts.unshift({ id, author: 'hyune', handle: '@hyune', content: p.content, time: 'now', likes: 0, reposts: 0, replies: 0 });
            break;
          case 'quickNotes':
            draft.quickNotes.unshift({ id, text: p.content, time: 'now', color: '#d895a6' });
            break;
          case 'gallery':
            draft.gallery.unshift({ id, title: p.title, album: 'Generated', date: p.timestamp || 'now', caption: p.content, tone: 'rose', dataUrl: p.metadata?.dataUrl });
            break;
          case 'instagram':
            draft.posts.unshift({ id, user: p.person || 'hyune.studio', caption: p.content, time: p.timestamp || 'now', tone: 'rose', likes: 0 });
            break;
          case 'notes':
            draft.notes.unshift({ id, title: p.title, meta: `generated · ${p.timestamp || 'now'}`, color: '#d79bb0', body: p.content });
            break;
          case 'voice':
            draft.voice.unshift({ id, title: p.title, date: p.timestamp || 'now', duration: String(p.metadata?.duration || '00:30'), transcript: p.content, private: true });
            break;
          case 'music':
          case 'studio':
            draft.studioProjects.unshift({ id, title: p.title, status: 'idea', updated: p.timestamp || 'now', metadata: p.content, hasAudio: false });
            break;
          case 'calendar':
            draft.events.unshift({ id, day: Number(p.metadata?.day || new Date().getDate()), title: p.title, time: p.timestamp || 'time not set', kind: String(p.metadata?.kind || 'story') });
            break;
          case 'browser':
            draft.browserHistory.unshift({ id, url: String(p.metadata?.url || 'about:story'), title: p.title, time: p.timestamp || 'now' });
            break;
          case 'calls':
            draft.calls.unshift({ id, name: p.person || p.title, time: p.timestamp || 'now', duration: p.metadata?.duration ? String(p.metadata.duration) : undefined, missed: Boolean(p.metadata?.missed), type: p.type === 'video' ? 'video' : p.type === 'voicemail' ? 'voicemail' : 'audio' });
            break;
          case 'notifications':
            draft.notifications.unshift({ id, icon: String(p.metadata?.icon || 'story'), title: p.title, sub: p.content, color: '#d895a6', time: p.timestamp || 'now' });
            break;
          case 'files':
            draft.files.unshift({ id, name: p.title, folder: String(p.metadata?.folder || 'Story'), type: String(p.metadata?.fileType || p.type || 'document'), date: p.timestamp || 'now' });
            break;
          case 'places':
            draft.places.unshift({ id, name: p.title, category: String(p.metadata?.category || 'important locations'), location: String(p.metadata?.location || p.content), notes: p.content, saved: true });
            break;
        }
      });
      return draft;
    });

    setProposals([]);
    setStoryUpdate('');
    setTab('update');
  };

  const generateImg = () => {
    if (!imagePrompt.trim()) return;
    generateImage.mutate({ data: { prompt: imagePrompt } }, {
      onSuccess: (res) => {
        const proposal = {
          id: `image-${Date.now()}`,
          app: 'gallery',
          type: 'generated image',
          title: 'Generated image',
          content: res.caption,
          timestamp: 'now',
          person: null,
          metadata: { dataUrl: res.dataUrl },
        };
        setProposals(prev => [proposal, ...prev]);
        setApprovedIds(prev => new Set(prev).add(proposal.id));
        setTab('proposals');
        setImagePrompt('');
      }
    });
  };

  const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl.length > 2_000_000) {
        alert("Image is too large for local storage. Please choose a smaller image.");
        return;
      }
      setStore(s => ({
        ...s,
        gallery: [{ id: `img-${Date.now()}`, title: 'Uploaded', album: 'Manual', date: 'now', caption: 'uploaded from device', tone: 'blue', dataUrl }, ...s.gallery]
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#12111d] text-[#f2ece5]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div>
          <h2 className="font-serif text-xl">Story Admin</h2>
          <div className="mt-1 flex items-center gap-3 text-[10px] text-white/50">
            {providersLoading ? <span>checking providers...</span> : providers && (
              <>
                <span className={providers.text.connected ? 'text-green-400' : 'text-red-400'} title={providers.text.label}>● Text</span>
                <span className={providers.image.connected ? 'text-green-400' : 'text-red-400'} title={providers.image.label}>● Image</span>
                <span className={providers.audio.connected ? 'text-green-400' : 'text-red-400'} title={providers.audio.label}>● Audio</span>
                <span className={providers.music.connected ? 'text-green-400' : 'text-red-400'} title={providers.music.label}>● Music</span>
              </>
            )}
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-2 hover:bg-white/10"><X size={20} /></button>
      </header>
      
      <div className="flex border-b border-white/10 text-xs">
        {['update', 'proposals', 'canon'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} className={`flex-1 py-3 ${tab === t ? 'border-b-2 border-[#d98ca7] text-[#d98ca7]' : 'text-white/50 hover:bg-white/5'}`}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'proposals' && proposals.length > 0 && <span className="ml-2 rounded-full bg-[#d98ca7] px-1.5 py-0.5 text-[9px] text-black">{proposals.length}</span>}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-5 pb-20">
        {tab === 'update' && (
          <div className="space-y-6">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/40">Mode</label>
              <div className="flex gap-2">
                <button onClick={() => setMode('story_update')} className={`flex-1 rounded-xl border py-2 text-xs ${mode === 'story_update' ? 'border-[#d98ca7] bg-[#d98ca7]/10 text-[#d98ca7]' : 'border-white/10 text-white/50'}`}>Story Update</button>
                <button onClick={() => setMode('generate_day')} className={`flex-1 rounded-xl border py-2 text-xs ${mode === 'generate_day' ? 'border-[#d98ca7] bg-[#d98ca7]/10 text-[#d98ca7]' : 'border-white/10 text-white/50'}`}>Generate Day</button>
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-xs uppercase tracking-widest text-white/40">RP Context / Prompt</label>
              <textarea 
                value={storyUpdate}
                onChange={e => setStoryUpdate(e.target.value)}
                placeholder="What is happening right now? (e.g. 'Hyunjin just finished a late night rehearsal and is walking to the Han river...')"
                className="h-48 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 outline-none focus:border-[#d98ca7]"
              />
            </div>

            <button 
              onClick={submitUpdate}
              disabled={generateActivity.isPending || !storyUpdate.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d98ca7] py-4 font-medium text-[#291d26] disabled:opacity-50"
            >
              {generateActivity.isPending ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
              {generateActivity.isPending ? 'Generating...' : 'Generate Activity'}
            </button>

            <div className="mt-8 border-t border-white/10 pt-6">
              <label className="mb-2 flex items-center gap-2 text-xs uppercase tracking-widest text-white/40"><ImageIcon size={14} /> Generate Gallery Image</label>
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <input 
                    value={imagePrompt}
                    onChange={e => setImagePrompt(e.target.value)}
                    placeholder="Describe a photo for the gallery..."
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-blue-400"
                  />
                  <button 
                    onClick={generateImg}
                    disabled={generateImage.isPending || !imagePrompt.trim()}
                    className="rounded-xl bg-blue-500/20 px-4 text-blue-300 disabled:opacity-50"
                  >
                    {generateImage.isPending ? '...' : 'Create'}
                  </button>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-white/30">OR</span>
                  <label className="cursor-pointer rounded-lg border border-white/10 px-3 py-1.5 text-xs text-white/50 hover:bg-white/5">
                    Upload from device
                    <input type="file" accept="image/*" className="hidden" onChange={handleManualImageUpload} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'proposals' && (
          <div>
            {proposals.length === 0 ? (
              <div className="mt-20 text-center text-white/30">No pending proposals.</div>
            ) : (
              <>
                <div className="mb-6 flex justify-between">
                  <button onClick={() => setApprovedIds(new Set(proposals.map(p => p.id)))} className="text-xs text-[#d98ca7]">Approve All</button>
                  <button onClick={() => setApprovedIds(new Set())} className="text-xs text-white/40">Deselect All</button>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(proposals.reduce((acc, p) => { acc[p.app] = [...(acc[p.app] || []), p]; return acc; }, {} as Record<string, any[]>)).map(([app, appProposals]) => (
                    <div key={app} className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-white/40">{app}</h3>
                      {(appProposals as any[]).map((p: any) => {
                        const approved = approvedIds.has(p.id);
                        const isEditing = editingId === p.id;
                        return (
                          <div key={p.id} className={`rounded-2xl border p-4 ${approved ? 'border-[#d98ca7]/50 bg-[#d98ca7]/5' : 'border-white/10 bg-white/5'}`}>
                            <div className="mb-3 flex items-center justify-between">
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">{p.type}</span>
                              <div className="flex gap-2">
                                 <button onClick={() => {
                                   if (isEditing) {
                                     setProposals(prev => prev.map(item => item.id === p.id ? { ...item, title: editTitle, content: editContent } : item));
                                     setEditingId(null);
                                   } else {
                                     setEditTitle(p.title);
                                     setEditContent(p.content);
                                     setEditingId(p.id);
                                   }
                                 }} className="text-white/40 hover:text-white">
                                  {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                                </button>
                                <button onClick={() => setProposals(prev => prev.filter(x => x.id !== p.id))} className="text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                                <button onClick={() => setApprovedIds(prev => { const n = new Set(prev); if (approved) n.delete(p.id); else n.add(p.id); return n; })} className={approved ? 'text-[#d98ca7]' : 'text-white/40'}>
                                  <CheckCircle2 size={18} />
                                </button>
                              </div>
                            </div>
                            {isEditing ? (
                               <div className="space-y-2">
                                 <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full rounded bg-black/20 p-2 text-sm font-medium outline-none" />
                                 <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full rounded bg-black/20 p-2 text-sm outline-none" rows={3} />
                               </div>
                            ) : (
                               <><h4 className="mb-1 font-medium">{p.title} {p.person && <span className="text-white/50 text-xs">· with {p.person}</span>}</h4><p className="text-sm text-white/70">{p.content}</p></>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setProposals([])} className="flex-1 rounded-xl border border-white/10 py-3 text-sm">Cancel</button>
                  <button onClick={submitUpdate} className="flex-1 rounded-xl border border-[#d98ca7]/50 py-3 text-sm text-[#d98ca7]">Regenerate</button>
                  <button onClick={publishApproved} className="flex-1 rounded-xl bg-[#d98ca7] py-3 text-sm text-[#291d26]">Publish Approved</button>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'canon' && (
          <div className="space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40">These memories define the AI's understanding of this phone.</p>
            {Object.keys(store.canon || seedCanon).map((key) => (
              <div key={key} className="rounded-xl bg-white/5 p-3">
                <label className="mb-2 block text-[10px] uppercase tracking-wider text-white/50">{key.replace(/([A-Z])/g, ' $1')}</label>
                <textarea 
                  value={(store.canon || seedCanon)[key as keyof Canon]}
                  onChange={(e) => handleCanonChange(key as keyof Canon, e.target.value)}
                  className="w-full resize-none bg-transparent text-sm leading-6 text-white outline-none"
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
