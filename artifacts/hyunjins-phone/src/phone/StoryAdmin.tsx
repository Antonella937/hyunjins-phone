import React, { useRef, useState } from 'react';
import { PhoneStore, Canon, seedCanon } from './config';
import { X, RefreshCw, Send, CheckCircle2, Trash2, Edit2, Check, Image as ImageIcon } from 'lucide-react';
import { useGetStoryProviders, useGenerateStoryActivity, useGenerateStoryImage } from '@workspace/api-client-react';
import type { ReviewProposal } from './publishActivity';
import { ImagePicker } from './InstagramImagePicker';

export function StoryAdmin({ store, setStore, onPublish, onClose }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; onPublish: (items: ReviewProposal[]) => void; onClose: () => void }) {
  const [tab, setTab] = useState<'update' | 'proposals' | 'canon'>('update');
  const [storyUpdate, setStoryUpdate] = useState('');
  const [mode, setMode] = useState<'story_update' | 'generate_day'>('story_update');
  const [imagePrompt, setImagePrompt] = useState('');

  const { data: providers, isLoading: providersLoading } = useGetStoryProviders();
  const generateActivity = useGenerateStoryActivity();
  const generateImage = useGenerateStoryImage();

  const [proposals, setProposals] = useState<ReviewProposal[]>([]);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());
  const [saveError, setSaveError] = useState('');
  const [success, setSuccess] = useState('');
  const publishing = useRef(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editImagePrompt, setEditImagePrompt] = useState('');
  const [editAudience, setEditAudience] = useState<'public' | 'close-friends'>('public');
  const [editContext, setEditContext] = useState('');
  const [editTimestamp, setEditTimestamp] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pickingStoryId, setPickingStoryId] = useState<string | null>(null);
  const [pendingPublicationIds, setPendingPublicationIds] = useState<string[] | null>(null);
  const imageError = (error: unknown) => {
    const response = error && typeof error === 'object' && 'response' in error ? (error as { response?: { data?: { error?: string } } }).response : undefined;
    return response?.data?.error || (error instanceof Error ? error.message : String(error));
  };

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
      recentEvents: store.events.slice(0,2),
      instagramProfile: { username: store.instagramProfile?.username || 'hyune.studio' },
      contacts: store.contacts.map(c => ({ id: c.id, name: c.name })),
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
        const batch = crypto.randomUUID();
        const items = data.proposals.map((p, i) => ({ ...p, reviewId: `${batch}:${i}` }));
        setProposals(items);
        setApprovedIds(new Set(items.map(p => p.reviewId)));
        setSaveError('');
        setTab('proposals');
      }
    });
  };

  const isImageNeeded = (item: ReviewProposal) =>
    item.app === 'instagram' && /story/i.test(item.type) && !item.metadata?.imageId && !item.metadata?.dataUrl;

  const persistApproved = async (items: ReviewProposal[]) => {
    if (publishing.current) return;
    publishing.current = true;
    setSaveError('');
    try {
      const ready = await Promise.all(items.map(async item => {
        const dataUrl = (item.app === 'gallery' || (item.app === 'instagram' && /story/i.test(item.type))) && typeof item.metadata?.dataUrl === 'string' ? item.metadata.dataUrl : '';
        if (!dataUrl) return item;
        const upload = await fetch('/api/story/image/upload', {
          method: 'POST', headers: { 'Content-Type': 'application/octet-stream' },
          body: await (await fetch(dataUrl)).blob(),
        });
        const result = await upload.json().catch(() => null) as { imageId?: string; error?: string } | null;
        if (!upload.ok || !result?.imageId) throw new Error(result?.error || 'Could not save the approved image.');
        const { dataUrl: _preview, ...metadata } = item.metadata || {};
        return { ...item, metadata: { ...metadata, imageId: result.imageId } };
      }));
      onPublish(ready);
      const savedIds = new Set(items.map(p => p.reviewId));
      setProposals(prev => prev.filter(p => !savedIds.has(p.reviewId)));
      setApprovedIds(prev => new Set([...prev].filter(id => !savedIds.has(id))));
      setSuccess(`${items.length} ${items.length === 1 ? 'item' : 'items'} saved to the phone.`);
      if (items.length === proposals.length) setTab('update');
    } catch (error) {
      console.error('Could not save generated activity', error);
      setSaveError(`Could not save generated activity: ${imageError(error)}`);
    } finally {
      publishing.current = false;
    }
  };

  const publishApproved = (single?: ReviewProposal) => {
    if (publishing.current) return;
    const items = single ? [single] : proposals.filter(p => approvedIds.has(p.reviewId));
    if (!items.length) return;
    const needsImage = items.find(isImageNeeded);
    if (needsImage) {
      setPendingPublicationIds(items.map(item => item.reviewId));
      setPickingStoryId(needsImage.reviewId);
      return;
    }
    void persistApproved(items);
  };

  const selectStoryImage = (result: { imageId?: string; dataUrl?: string; source?: 'gallery' | 'upload' | 'ai-generated' }) => {
    const updated = proposals.map(item => item.reviewId === pickingStoryId
      ? { ...item, metadata: { ...item.metadata, imageId: result.imageId, dataUrl: result.dataUrl, imageSource: result.source } }
      : item);
    setProposals(updated);
    if (pendingPublicationIds) {
      const selected = updated.filter(item => pendingPublicationIds.includes(item.reviewId));
      const next = selected.find(isImageNeeded);
      if (next) {
        setPickingStoryId(next.reviewId);
        return;
      }
      setPendingPublicationIds(null);
      setPickingStoryId(null);
      void persistApproved(selected);
    } else {
      setPickingStoryId(null);
    }
  };

  const generateImg = () => {
    if (!imagePrompt.trim()) return;
    generateImage.mutate({ data: { prompt: imagePrompt } }, {
      onSuccess: (res) => {
        const proposal: ReviewProposal = {
          id: `image-${crypto.randomUUID()}`,
          reviewId: `image-${crypto.randomUUID()}`,
          app: 'gallery',
          type: 'generated image',
          title: 'Generated image',
          content: res.caption,
          timestamp: 'now',
          person: null,
           metadata: { dataUrl: res.dataUrl },
        };
        setProposals(prev => [proposal, ...prev]);
        setApprovedIds(prev => new Set(prev).add(proposal.reviewId));
        setTab('proposals');
        setImagePrompt('');
      }
    });
  };

   const handleManualImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
     setUploadingImage(true);
     setSaveError('');
     try {
       const response = await fetch('/api/story/image/upload', {
         method: 'POST', headers: { 'Content-Type': 'application/octet-stream' }, body: file,
       });
       if (!response.ok) {
         const body = await response.json().catch(() => null) as { error?: string } | null;
         throw new Error(body?.error || 'Image upload failed.');
       }
       const { imageId } = await response.json() as { imageId?: string };
       if (!imageId) throw new Error('Image upload returned no persistent image reference.');
      setStore(s => ({
        ...s,
         gallery: [{ id: `img-${crypto.randomUUID()}`, title: 'Uploaded', album: 'Manual', date: new Date().toLocaleString(), caption: 'uploaded from device', tone: 'blue', imageId }, ...s.gallery]
      }));
       setSuccess('Image saved to Gallery.');
     } catch (error) {
       setSaveError(`Could not save image: ${imageError(error)}`);
     } finally {
       setUploadingImage(false);
       e.target.value = '';
     }
  };

  if (pickingStoryId) {
    const proposal = proposals.find(item => item.reviewId === pickingStoryId);
    return <div className="fixed inset-0 z-50 bg-[#251e2b]">
      <ImagePicker key={pickingStoryId} store={store} commit={setStore} initialPrompt={typeof proposal?.metadata?.imagePrompt === 'string' ? proposal.metadata.imagePrompt : ''} onSelect={selectStoryImage} onCancel={() => { setPickingStoryId(null); setPendingPublicationIds(null); }} />
      <p className="pointer-events-none absolute bottom-3 left-4 right-4 text-center text-[10px] text-white/50">Choose an image to finish this Story. Back keeps it in review.</p>
    </div>;
  }

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
                <span className={providers.audio.connected ? 'text-green-400' : 'text-red-400'} title={providers.audio.label}>● Audio / TTS: {providers.audio.connected ? 'Connected' : 'Not Connected'}</span>
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
        {saveError && <p role="alert" className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">{saveError}</p>}
        {success && <p role="status" className="mb-4 rounded-xl border border-[#a7c8ac]/30 bg-[#a7c8ac]/10 p-3 text-sm text-[#c2ddc4]">{success}</p>}
        {generateActivity.isError && <p role="alert" className="mb-4 text-sm text-red-200">Could not generate phone activity. Try again.</p>}
         {generateImage.isError && <p role="alert" className="mb-4 text-sm text-red-200">Could not generate image: {imageError(generateImage.error)}</p>}
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
                     <input type="file" accept="image/*" className="hidden" onChange={handleManualImageUpload} disabled={uploadingImage} />
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
                  <button onClick={() => setApprovedIds(new Set(proposals.map(p => p.reviewId)))} className="text-xs text-[#d98ca7]">Approve All</button>
                  <button onClick={() => setApprovedIds(new Set())} className="text-xs text-white/40">Deselect All</button>
                </div>
                
                <div className="space-y-6">
                  {Object.entries(proposals.reduce((acc, p) => { acc[p.app] = [...(acc[p.app] || []), p]; return acc; }, {} as Record<string, any[]>)).map(([app, appProposals]) => (
                    <div key={app} className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-widest text-white/40">{app}</h3>
                      {(appProposals as any[]).map((p: any) => {
                        const approved = approvedIds.has(p.reviewId);
                        const isEditing = editingId === p.reviewId;
                        return (
                          <div key={p.reviewId} className={`rounded-2xl border p-4 ${approved ? 'border-[#d98ca7]/50 bg-[#d98ca7]/5' : 'border-white/10 bg-white/5'}`}>
                            <div className="mb-3 flex items-center justify-between">
                              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/50">{p.type}</span>
                              <div className="flex gap-2">
                                 <button onClick={() => {
                                   if (isEditing) {
                                      setProposals(prev => prev.map(item => item.reviewId === p.reviewId ? {
                                        ...item, title: editTitle, content: editContent,
                                        ...(p.app === 'instagram' && /story/i.test(p.type) ? {
                                          timestamp: editTimestamp,
                                          metadata: { ...item.metadata, imagePrompt: editImagePrompt, audience: editAudience, context: editContext },
                                        } : {}),
                                      } : item));
                                     setEditingId(null);
                                   } else {
                                     setEditTitle(p.title);
                                     setEditContent(p.content);
                                      setEditImagePrompt(String(p.metadata?.imagePrompt || ''));
                                      setEditAudience(p.metadata?.audience === 'close-friends' ? 'close-friends' : 'public');
                                      setEditContext(String(p.metadata?.context || ''));
                                      setEditTimestamp(p.timestamp);
                                     setEditingId(p.reviewId);
                                   }
                                 }} className="text-white/40 hover:text-white">
                                  {isEditing ? <Check size={14} /> : <Edit2 size={14} />}
                                </button>
                                <button onClick={() => setProposals(prev => prev.filter(x => x.reviewId !== p.reviewId))} aria-label="Delete proposal" className="text-white/40 hover:text-red-400"><Trash2 size={14} /></button>
                                <button onClick={() => setApprovedIds(prev => { const n = new Set(prev); if (approved) n.delete(p.reviewId); else n.add(p.reviewId); return n; })} aria-label={approved ? 'Deselect proposal' : 'Select proposal'} className={approved ? 'text-[#d98ca7]' : 'text-white/40'}>
                                  <CheckCircle2 size={18} />
                                </button>
                              </div>
                            </div>
                            {isEditing ? (
                               <div className="space-y-2">
                                 <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full rounded bg-black/20 p-2 text-sm font-medium outline-none" />
                                 <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full rounded bg-black/20 p-2 text-sm outline-none" rows={3} />
                                  {p.app === 'instagram' && /story/i.test(p.type) && <>
                                    <label className="block text-xs text-white/60">Image prompt<input value={editImagePrompt} onChange={e => setEditImagePrompt(e.target.value)} className="mt-1 w-full rounded bg-black/20 p-2 text-sm text-white" /></label>
                                    <label className="block text-xs text-white/60">Date / time<input value={editTimestamp} onChange={e => setEditTimestamp(e.target.value)} className="mt-1 w-full rounded bg-black/20 p-2 text-sm text-white" /></label>
                                    <label className="block text-xs text-white/60">Context<input value={editContext} onChange={e => setEditContext(e.target.value)} className="mt-1 w-full rounded bg-black/20 p-2 text-sm text-white" /></label>
                                    <label className="block text-xs text-white/60">Audience<select value={editAudience} onChange={e => setEditAudience(e.target.value as 'public' | 'close-friends')} className="mt-1 w-full rounded bg-[#251e2b] p-2 text-sm text-white"><option value="public">Public</option><option value="close-friends">Close Friends</option></select></label>
                                  </>}
                               </div>
                            ) : (
                                <><h4 className="mb-1 font-medium">{p.title} {p.person && <span className="text-white/50 text-xs">· with {p.person}</span>}</h4><p className="text-sm text-white/70">{p.content}</p>{p.app === 'instagram' && /story/i.test(p.type) && <p className="mt-2 text-xs text-white/45">Image prompt: {p.metadata?.imagePrompt || 'not provided'} · {p.metadata?.audience || 'public'} · {p.timestamp}{!p.metadata?.imageId && !p.metadata?.dataUrl && ' · Image needed after approval'}</p>}</>
                            )}
                             {!isEditing && <>
                               {p.app === 'instagram' && /story/i.test(p.type) && <button onClick={() => setPickingStoryId(p.reviewId)} className="mr-4 mt-3 text-xs text-[#e7aabb]">{isImageNeeded(p) ? 'Choose / Upload / Generate Image' : 'Change Story Image'}</button>}
                               <button onClick={() => publishApproved(p)} className="mt-3 text-xs text-[#e7aabb]">Accept this item</button>
                             </>}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex gap-3">
                  <button onClick={() => setProposals([])} className="flex-1 rounded-xl border border-white/10 py-3 text-sm">Cancel</button>
                  <button onClick={submitUpdate} className="flex-1 rounded-xl border border-[#d98ca7]/50 py-3 text-sm text-[#d98ca7]">Regenerate</button>
                  <button onClick={() => publishApproved()} disabled={!approvedIds.size} className="flex-1 rounded-xl bg-[#d98ca7] py-3 text-sm text-[#291d26] disabled:opacity-50">Publish Approved</button>
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
