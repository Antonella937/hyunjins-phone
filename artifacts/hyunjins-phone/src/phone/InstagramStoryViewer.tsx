import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit3, Camera, Sparkles } from 'lucide-react';
import type { InstagramStory, PhoneStore } from './config';
import { ImagePicker } from './InstagramImagePicker';
import { storyAccount, storyImageUrl } from './InstagramStoryUtils';

export function StoryViewer({ story, store, sequence, onClose, onNext, onPrev, onEdit, editMode, commit }: { story: InstagramStory; store: PhoneStore; sequence: InstagramStory[]; onClose: () => void; onNext: () => void; onPrev: () => void; onEdit: () => void; editMode: boolean; commit: (update: (s: PhoneStore) => PhoneStore) => void }) {
  const [replacingImage, setReplacingImage] = useState<'gallery' | 'ai' | null>(null);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const [snippetPlaying, setSnippetPlaying] = useState(false);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  const imageUrl = storyImageUrl(story);
  const hasImage = !!imageUrl;
  const account = storyAccount(story, store);
  const snippet = story.audioTrackId ? (store.originalTracks || []).find(track => track.id === story.audioTrackId) : undefined;
  const currentSegment = sequence.findIndex(item => item.id === story.id);

  useEffect(() => {
    if (story.viewed) return;
    commit(s => ({ ...s, instagramStories: s.instagramStories.map(item => item.id === story.id ? { ...item, viewed: true } : item) }));
  }, [story.id, story.viewed, commit]);

  useEffect(() => {
    if (editMode || replacingImage || snippetPlaying || !hasImage) return;
    const duration = 5000;
    const step = 50;
    const increment = (step / duration) * 100;
    const timer = setInterval(() => setProgress(p => Math.min(100, p + increment)), step);
    return () => clearInterval(timer);
  }, [story.id, replacingImage, hasImage, editMode, snippetPlaying]);
  useEffect(() => {
    if (progress >= 100 && hasImage && !editMode && !replacingImage && !snippetPlaying) nextRef.current();
  }, [progress, hasImage, editMode, replacingImage, snippetPlaying]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
    setSnippetPlaying(false);
  }, [story.id]);

  const handleImageSelect = (res: { imageId?: string; dataUrl?: string; source?: 'gallery' | 'upload' | 'ai-generated' }) => {
    try {
      commit(s => ({
        ...s,
        instagramStories: s.instagramStories.map(st => st.id === story.id ? { ...st, imageId: res.imageId, dataUrl: res.dataUrl, source: res.source || st.source } : st)
      }));
      setReplacingImage(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save the Story image.');
    }
  };

  if (replacingImage) {
     return <div className="absolute inset-0 z-50 bg-black"><ImagePicker store={store} commit={commit} initialTab={replacingImage} initialPrompt={story.imagePrompt || ''} onSelect={handleImageSelect} onCancel={() => setReplacingImage(null)} />{error && <p role="alert" className="absolute bottom-4 left-4 right-4 rounded-xl bg-red-950 p-3 text-xs text-red-100">{error}</p>}</div>;
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black" onTouchStart={e => { touchStartY.current = e.touches[0].clientY; touchStartX.current = e.touches[0].clientX; }} onTouchEnd={e => {
      if (touchStartY.current !== null && touchStartX.current !== null) {
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        if (deltaY > 65 && Math.abs(deltaY) > Math.abs(deltaX)) { e.preventDefault(); onClose(); }
        else if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY)) { e.preventDefault(); if (deltaX < 0) onNext(); else onPrev(); }
      }
      touchStartY.current = null; touchStartX.current = null;
    }}>
      <div className="absolute left-0 top-0 z-20 w-full p-4 pt-8">
        <div className="mb-4 flex gap-1">
          {sequence.map((item, index) => <div key={item.id} className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full bg-white" style={{ width: `${index < currentSegment ? 100 : index === currentSegment ? progress : 0}%` }} />
          </div>)}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            {account.avatarUrl ? <img src={account.avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover" /> : <span className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold" style={{ background: account.color }}>{account.initials}</span>}
            <span className="text-sm font-medium drop-shadow-md">{account.name}</span>
            <span className="text-xs text-white/70 drop-shadow-md">{story.date ? `${story.date} · ` : ''}{story.time}</span>
          </div>
          <div className="flex gap-4">
            {editMode && <button aria-label="Replace Story image" onClick={e => { e.stopPropagation(); setReplacingImage('gallery'); }} className="text-white drop-shadow-md"><Camera size={19} /></button>}
            {editMode && (
              <button aria-label="Edit Story" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-white drop-shadow-md hover:text-[#d98ca7]"><Edit3 size={20} /></button>
            )}
            {editMode && (
              <button onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this story?')) {
                  commit((s: PhoneStore) => ({ 
                    ...s, 
                    instagramStories: s.instagramStories.filter(st => st.id !== story.id),
                    instagramHighlights: s.instagramHighlights?.map(h => ({ ...h, storyIds: h.storyIds.filter(id => id !== story.id) }))
                  }));
                  onClose();
                }
              }} aria-label="Delete Story" className="text-white drop-shadow-md hover:text-red-400"><Trash2 size={20} /></button>
            )}
            <button aria-label="Close Story" onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white drop-shadow-md"><X size={24} /></button>
          </div>
        </div>
      </div>

      <div className="relative flex-1 group">
        {hasImage ? (
          <img src={imageUrl} className="h-full w-full object-cover" />
        ) : (
           <div className="flex h-full flex-col items-center justify-center bg-[#1a1823] p-8 text-center relative z-0">
            <div className="relative z-20 flex flex-col items-center">
             <p className="mb-4 text-white/90 drop-shadow-md font-medium">This proposed story needs an image.</p>
              <button onClick={(e) => { e.stopPropagation(); setReplacingImage('gallery'); }} className="mb-2 flex items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm text-white">Choose or Upload Image</button>
              <button onClick={(e) => { e.stopPropagation(); setReplacingImage('ai'); }} className="flex items-center justify-center gap-2 rounded-xl bg-[#d98ca7] px-6 py-3 text-sm font-medium text-[#251e2b] shadow-lg hover:bg-[#e5a9b3] transition-colors"><Sparkles size={16} /> Generate Image</button>
            </div>
          </div>
        )}

         <button aria-label="Previous Story" className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={onPrev} />
         <button aria-label="Next Story" className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={onNext} />
      </div>

       {snippet?.audioId && <div className="absolute bottom-24 left-4 right-4 z-20 rounded-xl bg-black/65 p-3 text-white backdrop-blur-md">
         <p className="mb-2 text-[10px]">Original Tracks · {snippet.title} · 15-second snippet</p>
         <audio controls preload="metadata" className="w-full" src={`/api/music/audio/${snippet.audioId}`}
           onPlay={event => { document.querySelectorAll('audio').forEach(other => { if (other !== event.currentTarget) other.pause(); }); setSnippetPlaying(true); }}
           onPause={() => setSnippetPlaying(false)}
           onTimeUpdate={event => { if (event.currentTarget.currentTime >= 15) event.currentTarget.pause(); }} />
       </div>}
       {story.caption && (
        <div className="absolute bottom-8 left-0 w-full p-4 text-center z-10 pointer-events-none">
          <p className="inline-block rounded-xl bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md pointer-events-auto">{story.caption}</p>
        </div>
      )}
    </div>
  );
}
