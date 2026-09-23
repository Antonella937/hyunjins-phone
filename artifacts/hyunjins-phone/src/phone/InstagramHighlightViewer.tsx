import React, { useState } from 'react';
import { ArrowLeft, Trash2, Plus, X } from 'lucide-react';
import type { PhoneStore, InstagramHighlight } from './config';
import { StoryViewer } from './InstagramStoryViewer';

export function HighlightViewer({ store, highlight, onClose, onEditStory, editMode, commit }: { store: PhoneStore; highlight: InstagramHighlight; onClose: () => void; onEditStory: (id: string) => void; editMode: boolean; commit: any }) {
  const [viewingStoryId, setViewingStoryId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(highlight.name);
  const [addingStories, setAddingStories] = useState(false);

  const save = () => {
    commit((s: PhoneStore) => ({
      ...s,
      instagramHighlights: s.instagramHighlights?.map(h => h.id === highlight.id ? { ...h, name } : h)
    }));
    setIsEditing(false);
  };

  const deleteHighlight = () => {
    if (confirm('Delete this highlight?')) {
      commit((s: PhoneStore) => ({
        ...s,
        instagramHighlights: s.instagramHighlights?.filter(h => h.id !== highlight.id)
      }));
      onClose();
    }
  };

  const toggleStory = (storyId: string) => {
    commit((s: PhoneStore) => {
      const hList = s.instagramHighlights || [];
      const current = hList.find(h => h.id === highlight.id);
      if (!current) return s;
      const storyIds = current.storyIds.includes(storyId) ? current.storyIds.filter(id => id !== storyId) : [...current.storyIds, storyId];
      return { ...s, instagramHighlights: hList.map(h => h.id === highlight.id ? { ...h, storyIds } : h) };
    });
  };

  if (viewingStoryId) {
    const sIdx = store.instagramStories.findIndex(s => s.id === viewingStoryId);
    if (sIdx >= 0) {
      const sequence = highlight.storyIds.flatMap(id => {
        const story = store.instagramStories.find(item => item.id === id);
        return story ? [story] : [];
      });
      return <StoryViewer
        story={store.instagramStories[sIdx]}
        store={store}
        sequence={sequence}
        onClose={() => setViewingStoryId(null)}
        onNext={() => {
          const idx = sequence.findIndex(item => item.id === viewingStoryId);
          if (idx >= 0 && idx < sequence.length - 1) setViewingStoryId(sequence[idx + 1].id);
          else setViewingStoryId(null);
        }}
        onPrev={() => {
          const idx = sequence.findIndex(item => item.id === viewingStoryId);
          if (idx > 0) setViewingStoryId(sequence[idx - 1].id);
          else setViewingStoryId(null);
        }}
        onEdit={() => { setViewingStoryId(null); onEditStory(viewingStoryId); }}
        editMode={editMode}
        commit={commit}
      />;
    }
  }

  if (addingStories) {
    return (
      <div className="flex h-full flex-col bg-[#251e2b] p-4 text-white">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => setAddingStories(false)} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
          <span className="font-medium">Add Stories</span>
          <div className="w-5" />
        </div>
        <div className="grid grid-cols-3 gap-2 overflow-y-auto pb-8">
          {store.instagramStories.map(s => {
            const hasImage = !!(s.imageId || s.dataUrl);
            const isSelected = highlight.storyIds.includes(s.id);
            return (
              <button key={s.id} onClick={() => toggleStory(s.id)} className={`relative aspect-[9/16] overflow-hidden rounded-xl border-2 transition-all ${isSelected ? 'border-[#d98ca7] scale-95 opacity-80' : 'border-transparent'}`}>
                {hasImage ? <img src={s.imageId ? `/api/story/image/${s.imageId}` : s.dataUrl} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center bg-white/5 text-[10px] text-white/50">{s.user}</div>}
                {isSelected && <div className="absolute top-2 right-2 bg-[#d98ca7] text-[#251e2b] rounded-full p-0.5 shadow-md"><X size={12} /></div>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex h-full flex-col p-4 text-white">
        <div className="mb-6 flex items-center justify-between">
          <button onClick={() => setIsEditing(false)} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
          <span className="font-medium">Edit Highlight</span>
          <button onClick={save} className="text-[#d98ca7]">Save</button>
        </div>
        <div className="space-y-4 flex-1">
          <div><label className="mb-1 block text-[10px] uppercase text-white/50">Name</label><input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]" /></div>
          <button onClick={() => setAddingStories(true)} className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white hover:bg-white/10 flex items-center justify-center gap-2 transition-colors"><Plus size={16} /> Manage Stories</button>
        </div>
        <button onClick={deleteHighlight} className="rounded-xl border border-red-500/30 text-red-400 py-3 flex items-center justify-center gap-2 hover:bg-red-500/10 transition-colors"><Trash2 size={16} /> Delete Highlight</button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col p-4 text-white">
      <div className="mb-6 flex items-center justify-between">
        <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
        <span className="font-medium">{highlight.name}</span>
        {editMode ? <button onClick={() => setIsEditing(true)} className="text-xs text-[#e7aabb]">Edit</button> : <div className="w-5" />}
      </div>
      
      {highlight.storyIds.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/30 text-white/30">
            <Plus size={24} />
          </div>
          <p className="text-sm text-white/50">No stories here yet.</p>
          {editMode && <button onClick={() => setAddingStories(true)} className="mt-4 rounded-xl bg-white/10 px-4 py-2 text-sm hover:bg-white/20 transition-colors">Add Stories</button>}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 overflow-y-auto pb-8">
          {highlight.storyIds.map(storyId => {
            const s = store.instagramStories.find(st => st.id === storyId);
            if (!s) return null;
            const hasImage = !!(s.imageId || s.dataUrl);
            return (
              <button key={s.id} onClick={() => setViewingStoryId(s.id)} className="relative aspect-[9/16] overflow-hidden rounded-xl bg-white/5 group">
                {hasImage ? <img src={s.imageId ? `/api/story/image/${s.imageId}` : s.dataUrl} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-[10px] text-white/50">{s.user}</div>}
                <div className="absolute bottom-2 left-2 text-[10px] text-white/70 bg-black/40 px-2 py-0.5 rounded-md backdrop-blur-sm">{s.time}</div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
