import React, { useState } from 'react';
import { ArrowLeft, Upload, Sparkles, RefreshCw, X } from 'lucide-react';
import type { PhoneStore, GalleryItem } from './config';

async function uploadDataUrl(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith('data:')) throw new Error('Cannot upload this gallery item directly.');
  
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  
  const uploadRes = await fetch('/api/story/image/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: blob
  });
  
  const result = await uploadRes.json();
  if (!uploadRes.ok) throw new Error(result.error || 'Upload failed');
  return result.imageId;
}

export function ImagePicker({ store, commit, onSelect, onCancel, initialTab = 'gallery', initialPrompt = '' }: { store: PhoneStore; commit: (update: (s: PhoneStore) => PhoneStore) => void; onSelect: (result: { imageId?: string; dataUrl?: string; source?: 'gallery' | 'upload' | 'ai-generated' }) => void; onCancel: () => void; initialTab?: 'gallery' | 'upload' | 'ai'; initialPrompt?: string }) {
  const [tab, setTab] = useState<'gallery' | 'upload' | 'ai'>(initialTab);
  const [prompt, setPrompt] = useState(initialPrompt);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ dataUrl: string } | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setGenerating(true);
      setError('');
      const res = await fetch('/api/story/image/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/octet-stream' },
        body: file
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      onSelect({ imageId: data.imageId, source: 'upload' });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/story/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate image');
       if (!data.dataUrl) throw new Error('Image generation returned no preview.');
       setPreview({ dataUrl: data.dataUrl });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const useGeneratedImage = async () => {
    if (!preview || generating) return;
    setGenerating(true);
    setError('');
    try {
      const imageId = await uploadDataUrl(preview.dataUrl);
      onSelect({ imageId, source: 'ai-generated' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the generated image.');
    } finally {
      setGenerating(false);
    }
  };

  const selectGallery = async (g: GalleryItem) => {
    if (g.imageId) {
      onSelect({ imageId: g.imageId, source: 'gallery' });
      return;
    }
    if (g.dataUrl) {
      try {
        setGenerating(true);
        setError('');
        const imageId = await uploadDataUrl(g.dataUrl);
        commit(s => ({
          ...s,
          gallery: s.gallery.map(item => item.id === g.id ? { ...item, imageId, dataUrl: undefined } : item),
        }));
        onSelect({ imageId, source: 'gallery' });
      } catch (err: any) {
        setError(err.message);
        setGenerating(false);
      }
    }
  };

  const validGallery = store.gallery?.filter(g => g.imageId || g.dataUrl) || [];

  return (
    <div className="flex h-full flex-col bg-[#251e2b] p-4 text-white">
      <div className="mb-4 flex items-center justify-between">
        <button onClick={onCancel} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
        <span className="font-medium">Select Image</span>
        <div className="w-5" />
      </div>
      <div className="mb-4 flex gap-2">
        {(['gallery', 'upload', 'ai'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 rounded-xl py-2 text-xs capitalize transition-colors ${tab === t ? 'bg-[#d98ca7] text-[#251e2b] font-medium' : 'bg-white/10 text-white/70 hover:bg-white/15'}`}>{t}</button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {error && <div className="mb-4 rounded-xl bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20 flex items-start gap-2">
           <X size={14} className="mt-0.5 shrink-0" onClick={() => setError('')} />
           <p className="flex-1">{error}</p>
        </div>}
        
        {tab === 'gallery' && (
          <div className="grid grid-cols-2 gap-2">
            {generating && <div className="col-span-2 flex items-center justify-center p-8"><RefreshCw className="animate-spin text-white/50" /></div>}
            {!generating && validGallery.map(g => (
              <button key={g.id} onClick={() => selectGallery(g)} className="relative aspect-square overflow-hidden rounded-xl bg-white/10 group">
                {g.imageId || g.dataUrl ? <img src={g.imageId ? `/api/story/image/${g.imageId}` : g.dataUrl} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : null}
              </button>
            ))}
            {!generating && validGallery.length === 0 && <p className="col-span-2 text-center text-xs text-white/50 py-8">No supported images in Gallery.</p>}
          </div>
        )}
        
        {tab === 'upload' && (
          <div className="flex h-full flex-col items-center justify-center">
            {generating ? <RefreshCw className="animate-spin text-white/50" /> : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/20 p-12 hover:bg-white/5 transition-colors w-full">
                <Upload className="mb-3 text-white/50" size={32} />
                <span className="text-sm font-medium text-white/70">Choose a file</span>
                <span className="text-xs text-white/40 mt-1">JPEG, PNG, WebP up to 12MB</span>
                <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} />
              </label>
            )}
          </div>
        )}
        
        {tab === 'ai' && (
          <div className="flex h-full flex-col gap-4">
            {preview ? (
              <div className="flex flex-col gap-4">
                <img src={preview.dataUrl} className="w-full rounded-2xl object-cover" />
                <div className="flex gap-2">
                  <button onClick={() => setPreview(null)} className="flex-1 rounded-xl border border-white/20 bg-transparent py-3 text-sm hover:bg-white/5 transition-colors">Cancel</button>
                  <button onClick={handleGenerate} disabled={generating} className="flex-1 rounded-xl bg-white/10 py-3 text-sm hover:bg-white/20 transition-colors flex justify-center items-center gap-2">
                    {generating ? <RefreshCw className="animate-spin" size={16} /> : 'Regenerate'}
                  </button>
                </div>
                <button onClick={useGeneratedImage} disabled={generating} className="w-full rounded-xl bg-[#d98ca7] py-3 text-sm font-medium text-[#251e2b] shadow-lg hover:bg-[#e5a9b3] transition-colors disabled:opacity-50">{generating ? 'Saving Image…' : 'Use Image'}</button>
              </div>
            ) : (
              <>
                <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="Describe the image..." className="min-h-32 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#d98ca7] transition-colors" />
                <button onClick={handleGenerate} disabled={generating || !prompt.trim()} className="flex items-center justify-center gap-2 rounded-xl bg-[#d98ca7] py-3 text-sm font-medium text-[#251e2b] shadow-lg disabled:opacity-50 hover:bg-[#e5a9b3] transition-colors">
                  {generating ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                  ✨ Generate Image with AI
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
