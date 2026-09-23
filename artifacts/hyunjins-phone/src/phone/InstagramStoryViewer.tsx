import React, { useState, useEffect, useRef } from 'react';
import { X, Trash2, Edit3, Camera, Sparkles } from 'lucide-react';
import type { InstagramStory, PhoneStore } from './config';
import { ImagePicker } from './InstagramImagePicker';

export function StoryViewer({ story, store, onClose, onNext, onPrev, onEdit, editMode, commit }: { story: InstagramStory; store: PhoneStore; onClose: () => void; onNext: () => void; onPrev: () => void; onEdit: () => void; editMode: boolean; commit: any }) {
  const [replacingImage, setReplacingImage] = useState<'gallery' | 'ai' | null>(null);
  const [progress, setProgress] = useState(0);
  const touchStartY = useRef<number | null>(null);
  const nextRef = useRef(onNext);
  nextRef.current = onNext;

  const hasImage = !!(story.imageId || story.dataUrl);
  const imageUrl = story.imageId ? `/api/story/image/${story.imageId}` : story.dataUrl;

  useEffect(() => {
    if (replacingImage || !hasImage) return;
    const duration = 5000;
    const step = 50;
    const increment = (step / duration) * 100;
    const timer = setInterval(() => setProgress(p => Math.min(100, p + increment)), step);
    return () => clearInterval(timer);
  }, [story.id, replacingImage, hasImage]);
  useEffect(() => {
    if (progress >= 100 && hasImage) nextRef.current();
  }, [progress, hasImage]);

  // Reset progress when story changes
  useEffect(() => {
    setProgress(0);
  }, [story.id]);

  const handleImageSelect = (res: { imageId?: string; dataUrl?: string }) => {
    commit((s: PhoneStore) => ({
      ...s,
      instagramStories: s.instagramStories.map(st => st.id === story.id ? { ...st, imageId: res.imageId, dataUrl: res.dataUrl } : st)
    }));
    setReplacingImage(null);
  };

  if (replacingImage) {
     return <div className="absolute inset-0 z-50 bg-black"><ImagePicker store={store} initialTab={replacingImage} initialPrompt={story.imagePrompt || ''} onSelect={handleImageSelect} onCancel={() => setReplacingImage(null)} /></div>;
  }

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-black" onTouchStart={e => { touchStartY.current = e.touches[0].clientY; }} onTouchEnd={e => { if (touchStartY.current !== null && e.changedTouches[0].clientY - touchStartY.current > 65) onClose(); touchStartY.current = null; }}>
      <div className="absolute left-0 top-0 z-10 w-full p-4 pt-8">
        <div className="mb-4 flex gap-1">
          <div className="h-0.5 flex-1 rounded-full bg-white/30 overflow-hidden">
             <div className="h-full bg-white" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
              {story.user.substring(0, 2).toUpperCase()}
            </span>
            <span className="text-sm font-medium drop-shadow-md">{story.user}</span>
            <span className="text-xs text-white/70 drop-shadow-md">{story.time}</span>
          </div>
          <div className="flex gap-4">
            {editMode && (
              <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="text-white drop-shadow-md hover:text-[#d98ca7]"><Edit3 size={20} /></button>
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
              }} className="text-white drop-shadow-md hover:text-red-400"><Trash2 size={20} /></button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="text-white drop-shadow-md"><X size={24} /></button>
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
             <button onClick={(e) => { e.stopPropagation(); setReplacingImage('ai'); }} className="flex items-center justify-center gap-2 rounded-xl bg-[#d98ca7] px-6 py-3 text-sm font-medium text-[#251e2b] shadow-lg hover:bg-[#e5a9b3] transition-colors">
               <Sparkles size={16} /> Generate Image with AI
             </button>
            </div>
          </div>
        )}

        <div className="absolute inset-y-0 left-0 w-1/3 z-10" onClick={onPrev} />
        <div className="absolute inset-y-0 right-0 w-1/3 z-10" onClick={onNext} />
      </div>

      {story.caption && (
        <div className="absolute bottom-8 left-0 w-full p-4 text-center z-10 pointer-events-none">
          <p className="inline-block rounded-xl bg-black/50 px-4 py-2 text-sm text-white backdrop-blur-md pointer-events-auto">{story.caption}</p>
        </div>
      )}
    </div>
  );
}
