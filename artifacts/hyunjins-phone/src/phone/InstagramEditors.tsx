import React, { useState } from 'react';
import { ArrowLeft, Trash2, Camera, X } from 'lucide-react';
import type { PhoneStore, Post, InstagramProfile, InstagramStory, Contact } from './config';
import { ImagePicker } from './InstagramImagePicker';
import { isRetiredStoryContact } from './InstagramStoryUtils';

function localDateTime(value?: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ProfileEditor({ store, onClose, commit }: { store: PhoneStore; onClose: () => void; commit: any }) {
  const [profile, setProfile] = useState<InstagramProfile>(store.instagramProfile || {
    displayName: 'Hyunjin', username: 'hyune.studio', bio: '', location: 'Seoul'
  });
  const [pickingImage, setPickingImage] = useState(false);

  const save = () => {
    commit((s: PhoneStore) => ({ ...s, instagramProfile: profile }));
    onClose();
  };

  if (pickingImage) return <ImagePicker store={store} commit={commit} onSelect={(res) => { setProfile({ ...profile, photoDataUrl: res.dataUrl, imageId: res.imageId }); setPickingImage(false); }} onCancel={() => setPickingImage(false)} />;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
        <span className="font-medium">Edit Profile</span>
        <button onClick={save} className="text-[#d98ca7]">Save</button>
      </div>
      <div className="flex flex-col items-center mb-6">
        <div className="relative mb-2">
          {(profile.imageId || profile.photoDataUrl) ? (
            <img src={profile.imageId ? `/api/story/image/${profile.imageId}` : profile.photoDataUrl} className="h-20 w-20 rounded-full object-cover" />
          ) : (
             <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#d895a6] text-xl font-bold text-[#251e2b]">
                {profile.displayName.substring(0,1).toUpperCase()}
             </span>
          )}
          <button onClick={() => setPickingImage(true)} className="absolute bottom-0 right-0 rounded-full bg-[#251e2b] p-1.5 text-white shadow-lg"><Camera size={14} /></button>
        </div>
      </div>
      <div className="space-y-4 px-4 flex-1 overflow-y-auto">
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Display Name</label><input value={profile.displayName} onChange={e => setProfile({...profile, displayName: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Username</label><input value={profile.username} onChange={e => setProfile({...profile, username: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Bio</label><input value={profile.bio} onChange={e => setProfile({...profile, bio: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Location</label><input value={profile.location || ''} onChange={e => setProfile({...profile, location: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
      </div>
    </div>
  );
}

export function PostEditor({ store, postId, onClose, commit }: { store: PhoneStore; postId?: string; onClose: () => void; commit: any }) {
  const existing = postId ? store.posts.find(p => p.id === postId) : undefined;
  const [draft, setDraft] = useState<Partial<Post>>(existing ? JSON.parse(JSON.stringify(existing)) : {
    id: `p-${Date.now()}`, user: store.instagramProfile?.username || 'hyune.studio', caption: '', time: 'just now', tone: 'blue', likes: 0, audience: 'public'
  });
  const [pickingImage, setPickingImage] = useState(!existing?.dataUrl && !existing?.imageId);
  const [previewing, setPreviewing] = useState(false);
  const [saveError, setSaveError] = useState('');

  const save = () => {
    try {
      commit((s: PhoneStore) => {
        const posts = existing ? s.posts.map(p => p.id === draft.id ? (draft as Post) : p) : [draft as Post, ...s.posts];
        return { ...s, posts };
      });
      onClose();
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save this post.');
    }
  };

  const toggleTag = (cId: string) => {
    const tags = draft.taggedContactIds || [];
    setDraft({ ...draft, taggedContactIds: tags.includes(cId) ? tags.filter(id => id !== cId) : [...tags, cId] });
  };

  if (pickingImage) return <ImagePicker store={store} commit={commit} onSelect={(res) => { setDraft({ ...draft, imageId: res.imageId, dataUrl: res.dataUrl }); setPickingImage(false); }} onCancel={() => { if (!draft.imageId && !draft.dataUrl && !existing) onClose(); else setPickingImage(false); }} />;

  if (previewing) return <div className="space-y-4 px-4 pt-4">
    <button onClick={() => setPreviewing(false)} className="flex items-center gap-2 text-sm text-[#e7aabb]"><ArrowLeft size={16} /> Edit Post</button>
    <h3 className="font-serif text-2xl">Preview Post</h3>
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.045]">
      <p className="px-4 py-3 text-xs">{draft.user} · {draft.time} {draft.location && `· ${draft.location}`}</p>
      {draft.imageId || draft.dataUrl ? <img src={draft.imageId ? `/api/story/image/${draft.imageId}` : draft.dataUrl} alt="Post preview" className="aspect-square w-full object-cover" /> : <div className="flex aspect-square items-center justify-center bg-white/5 text-sm text-white/50">No image selected</div>}
      <p className="px-4 py-3 text-xs">{draft.caption}</p>
    </div>
    {saveError && <p role="alert" className="text-xs text-red-300">{saveError}</p>}
    <button onClick={save} className="w-full rounded-xl bg-[#d98ca7] py-3 text-sm text-[#251e2b]">Publish Post</button>
  </div>;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
        <span className="font-medium">{existing ? 'Edit Post' : 'New Post'}</span>
        <button onClick={existing ? save : () => setPreviewing(true)} className="text-[#d98ca7]">{existing ? 'Save' : 'Preview'}</button>
      </div>
      {saveError && <p role="alert" className="mx-4 mb-3 text-xs text-red-300">{saveError}</p>}
      <div className="mb-4 aspect-square w-full overflow-hidden bg-white/5 relative group cursor-pointer" onClick={() => setPickingImage(true)}>
        {(draft.imageId || draft.dataUrl) ? (
          <img src={draft.imageId ? `/api/story/image/${draft.imageId}` : draft.dataUrl} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/30">
            <Camera size={32} className="mb-2" />
            <span className="text-xs">Tap to choose image</span>
          </div>
        )}
        {(draft.imageId || draft.dataUrl) && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
             <span className="text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md">Replace Image</span>
          </div>
        )}
      </div>
      <div className="space-y-4 px-4 flex-1 overflow-y-auto pb-6">
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Account / author</label><input value={draft.user || ''} onChange={e => setDraft({ ...draft, user: e.target.value })} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Relink to existing contact</label><select value="" onChange={e => { const contact = store.contacts.find(c => c.id === e.target.value); if (contact) setDraft({ ...draft, user: contact.name, taggedContactIds: [...new Set([...(draft.taggedContactIds || []), contact.id])] }); }} className="w-full rounded-xl border border-white/10 bg-[#251e2b] p-3 text-sm text-white"><option value="">Choose a contact…</option>{store.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Caption</label><textarea value={draft.caption} onChange={e => setDraft({...draft, caption: e.target.value})} className="min-h-24 w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        
        <div className="flex gap-4">
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Location</label><input value={draft.location || ''} onChange={e => setDraft({...draft, location: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Date/Time</label><input value={draft.time} onChange={e => setDraft({...draft, time: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Likes count</label><input type="number" value={draft.likes} onChange={e => setDraft({...draft, likes: parseInt(e.target.value) || 0})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Audience</label><select value={draft.audience || 'public'} onChange={e => setDraft({...draft, audience: e.target.value as any})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7] appearance-none"><option value="public">Public</option><option value="close-friends">Close Friends</option></select></div>
        </div>

        <div>
          <label className="mb-1 block text-[10px] uppercase text-white/50">Tagged Contacts</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {draft.taggedContactIds?.map(cId => {
              const c = store.contacts.find(x => x.id === cId);
              return <span key={cId} className="bg-white/10 text-xs px-2 py-1 rounded-md flex items-center gap-1">{c?.name || cId} <X size={12} className="cursor-pointer hover:text-red-400" onClick={() => toggleTag(cId)} /></span>;
            })}
          </div>
          <select onChange={e => { if (e.target.value) { toggleTag(e.target.value); e.target.value=''; } }} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7] appearance-none">
            <option value="">+ Add tag...</option>
            {store.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {existing && (
          <div>
            <label className="mb-1 block text-[10px] uppercase text-white/50">Manage Comments</label>
            {draft.comments?.length ? (
              <div className="space-y-2">
                {draft.comments.map(c => (
                  <div key={c.id} className="flex items-start justify-between gap-2 bg-white/5 p-2 rounded-lg text-xs">
                    <div className="min-w-0 flex-1"><b>{c.user}</b><input aria-label={`Edit comment by ${c.user}`} value={c.text} onChange={e => setDraft({ ...draft, comments: draft.comments?.map(x => x.id === c.id ? { ...x, text: e.target.value } : x) })} className="mt-1 block w-full rounded bg-white/5 p-1 text-xs text-white" /></div>
                    <button onClick={() => setDraft({...draft, comments: draft.comments?.filter(x => x.id !== c.id)})} className="text-white/30 hover:text-red-400"><X size={14} /></button>
                  </div>
                ))}
              </div>
            ) : <p className="text-xs text-white/40">No comments.</p>}
          </div>
        )}

        {existing && (
          <button onClick={() => {
            if (confirm('Delete this post?')) {
              commit((s: PhoneStore) => ({ ...s, posts: s.posts.filter(p => p.id !== existing.id) }));
              onClose();
            }
          }} className="mt-8 w-full rounded-xl border border-red-500/30 text-red-400 py-3 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
            <Trash2 size={16} /> Delete Post
          </button>
        )}
      </div>
    </div>
  );
}

export function StoryEditor({ store, storyId, onClose, commit, editMode }: { store: PhoneStore; storyId?: string; onClose: () => void; commit: any; editMode: boolean }) {
  const existing = storyId ? store.instagramStories.find(p => p.id === storyId) : undefined;
  const [draft, setDraft] = useState<Partial<InstagramStory>>(existing ? JSON.parse(JSON.stringify(existing)) : {
    id: `s-${Date.now()}`, user: store.instagramProfile?.username || 'hyune.studio', caption: '', date: localDateTime(new Date().toISOString()).slice(0, 10), time: 'just now', audience: 'public', createdAt: new Date().toISOString(), viewed: false, source: 'manual'
  });
  const [pickingImage, setPickingImage] = useState(!existing?.dataUrl && !existing?.imageId);
  const [error, setError] = useState('');

  const save = () => {
    if (!existing && !draft.imageId && !draft.dataUrl) {
      setError('An image is required for stories.');
      return;
    }
    const contact = draft.contactId ? store.contacts.find(c => c.id === draft.contactId) : undefined;
    if (draft.contactId && !contact) {
      setError('This contact no longer exists. Choose an existing contact.');
      return;
    }
    try {
      commit((s: PhoneStore) => {
        const updated = {
          ...draft,
          user: contact?.name || draft.user || s.instagramProfile.username,
          createdAt: draft.createdAt || new Date().toISOString(),
        } as InstagramStory;
        const stories = existing ? s.instagramStories.map(p => p.id === draft.id ? updated : p) : [updated, ...s.instagramStories];
        return { ...s, instagramStories: stories };
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save this story.');
    }
  };

  const toggleTag = (cId: string) => {
    const tags = draft.taggedContactIds || [];
    setDraft({ ...draft, taggedContactIds: tags.includes(cId) ? tags.filter(id => id !== cId) : [...tags, cId] });
  };

  if (pickingImage) return <ImagePicker store={store} commit={commit} initialTab={existing && !draft.imageId && !draft.dataUrl && draft.imagePrompt ? 'ai' : 'gallery'} initialPrompt={draft.imagePrompt || ''} onSelect={(res) => { setDraft({ ...draft, imageId: res.imageId, dataUrl: res.dataUrl, source: res.source || draft.source }); setPickingImage(false); setError(''); }} onCancel={() => { if (!draft.imageId && !draft.dataUrl && !existing) onClose(); else setPickingImage(false); }} />;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between px-4 pt-4">
        <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
        <span className="font-medium">{existing ? 'Edit Story' : 'New Story'}</span>
        <button onClick={save} className="text-[#d98ca7]">Post</button>
      </div>
      
      {error && <div className="mx-4 mb-4 text-xs text-red-400">{error}</div>}

      <div className="mb-4 aspect-[9/16] w-2/3 mx-auto overflow-hidden rounded-2xl bg-white/5 relative group cursor-pointer" onClick={() => setPickingImage(true)}>
        {(draft.imageId || draft.dataUrl) ? (
          <img src={draft.imageId ? `/api/story/image/${draft.imageId}` : draft.dataUrl} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-white/30 bg-gradient-to-b from-[#394763] to-[#e9bb92]">
            <Camera size={32} className="mb-2" />
            <span className="text-xs">Tap to set image</span>
          </div>
        )}
        {(draft.imageId || draft.dataUrl) && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
             <span className="text-white text-sm bg-black/50 px-3 py-1.5 rounded-lg backdrop-blur-md">Replace Image</span>
          </div>
        )}
      </div>
      <div className="space-y-4 px-4 flex-1 overflow-y-auto pb-6">
        {editMode && <div><label className="mb-1 block text-[10px] uppercase text-white/50">Story account</label>
          <select value={draft.contactId || (existing && !['hyune.studio', 'hyunjin', store.instagramProfile?.username].includes(draft.user || '') ? 'legacy' : 'self')} onChange={e => { const contact = store.contacts.find(c => c.id === e.target.value); setDraft({ ...draft, contactId: contact?.id, user: contact?.name || store.instagramProfile?.username || 'hyune.studio' }); }} className="w-full rounded-xl border border-white/10 bg-[#251e2b] p-3 text-sm text-white">
            {existing && !draft.contactId && !['hyune.studio', 'hyunjin', store.instagramProfile?.username].includes(draft.user || '') && <option value="legacy">Original account: {draft.user}</option>}
            <option value="self">You / {store.instagramProfile?.username || 'hyune.studio'}</option>
            {store.contacts.filter(c => !isRetiredStoryContact(c.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <p className="mt-1 text-[10px] text-white/40">Accounts follow names and photos in Contacts. No new contact is created.</p>
        </div>}
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Caption (optional)</label><input value={draft.caption} onChange={e => setDraft({...draft, caption: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        
        <div className="flex gap-4">
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Location</label><input value={draft.location || ''} onChange={e => setDraft({...draft, location: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
          <div className="flex-1"><label className="mb-1 block text-[10px] uppercase text-white/50">Date</label><input type="date" value={draft.date || ''} onChange={e => setDraft({...draft, date: e.target.value})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
        </div>
        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Time</label><input value={draft.time || ''} onChange={e => setDraft({...draft, time: e.target.value})} placeholder="just now or 18:30" className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>

        <div><label className="mb-1 block text-[10px] uppercase text-white/50">Audience</label><select value={draft.audience || 'public'} onChange={e => setDraft({...draft, audience: e.target.value as any})} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7] appearance-none"><option value="public">Public</option><option value="close-friends">Close Friends</option></select></div>
        {editMode && <div>
          <label className="mb-1 block text-[10px] uppercase text-white/50">Expires (optional)</label>
          <input type="datetime-local" value={localDateTime(draft.expiresAt)} onChange={e => setDraft({ ...draft, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" />
          <label className="mt-3 flex items-center gap-2 text-xs text-white/60"><input type="checkbox" checked={!!draft.viewed} onChange={e => setDraft({ ...draft, viewed: e.target.checked })} /> Mark as viewed</label>
        </div>}

        <div>
          <label className="mb-1 block text-[10px] uppercase text-white/50">Tagged Contacts</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {draft.taggedContactIds?.map(cId => {
              const c = store.contacts.find(x => x.id === cId);
              return <span key={cId} className="bg-white/10 text-xs px-2 py-1 rounded-md flex items-center gap-1">{c?.name || cId} <X size={12} className="cursor-pointer hover:text-red-400" onClick={() => toggleTag(cId)} /></span>;
            })}
          </div>
          <select onChange={e => { if (e.target.value) { toggleTag(e.target.value); e.target.value=''; } }} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7] appearance-none">
            <option value="">+ Add tag...</option>
            {store.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {existing && (
          <button onClick={() => {
            if (confirm('Delete this story?')) {
              commit((s: PhoneStore) => ({ 
              ...s, 
              instagramStories: s.instagramStories.filter(p => p.id !== existing.id),
              instagramHighlights: s.instagramHighlights?.map(h => ({ ...h, storyIds: h.storyIds.filter(id => id !== existing.id) }))
            }));
              onClose();
            }
          }} className="mt-8 w-full rounded-xl border border-red-500/30 text-red-400 py-3 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors">
            <Trash2 size={16} /> Delete Story
          </button>
        )}
      </div>
    </div>
  );
}
