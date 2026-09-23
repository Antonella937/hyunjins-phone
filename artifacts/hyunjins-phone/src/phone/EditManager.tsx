import { useState } from 'react';
import { ArrowLeft, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { PhoneStore } from './config';
import { editSections, type EditorField, type EditorSection } from './editCollections';

type RecordValue = Record<string, unknown> & { id: string };
type Props = {
  app: string;
  initialId?: string;
  onDeleted?: (id: string) => void;
  store: PhoneStore;
  commit: (update: (current: PhoneStore) => PhoneStore) => void;
  onClose: () => void;
};

function records(store: PhoneStore, section: EditorSection): RecordValue[] {
  const values = store[section.key];
  if (!Array.isArray(values)) return [];
  return (values as RecordValue[]).filter(item => !section.include || section.include(item));
}

function labelFor(record: RecordValue, section: EditorSection): string {
  for (const key of ['name', 'person', 'title', 'text', 'content', 'caption', 'preview', 'url']) {
    if (typeof record[key] === 'string' && record[key]) return String(record[key]).slice(0, 70);
  }
  return `${section.title} ${record.id.slice(-5)}`;
}

const inputClass = 'w-full rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white outline-none focus:border-[#d98ca7]';
const MAX_IMAGE_BYTES = 1_500_000;
const MAX_AUDIO_BYTES = 15_000_000;

function audioDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const audio = document.createElement('audio');
    const timeout = window.setTimeout(() => finish(null), 15_000);
    const finish = (value: number | null) => {
      window.clearTimeout(timeout);
      audio.onloadedmetadata = null;
      audio.onerror = null;
      audio.removeAttribute('src');
      audio.load();
      URL.revokeObjectURL(url);
      value && Number.isFinite(value) && value > 0 ? resolve(value) : reject(new Error('Could not read the audio duration. Choose a supported audio file.'));
    };
    audio.onloadedmetadata = () => finish(audio.duration);
    audio.onerror = () => finish(null);
    audio.preload = 'metadata';
    audio.src = url;
  });
}

async function uploadAudio(file: File): Promise<{ audioId: string; durationSeconds: number }> {
  if (file.size > MAX_AUDIO_BYTES) throw new Error('Audio must be smaller than 15 MB.');
  const durationSeconds = await audioDuration(file);
  const response = await fetch('/api/story/voice/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/octet-stream', 'X-Audio-Duration': String(durationSeconds) },
    body: file,
  });
  if (!response.ok) {
    const message = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(message?.error || 'Audio upload failed.');
  }
  const result = await response.json() as { audioId: string; durationSeconds: number };
  if (!result.audioId || !Number.isFinite(result.durationSeconds)) throw new Error('Audio upload returned an invalid result.');
  return result;
}

export function EditManager({ app, initialId, onDeleted, store, commit, onClose }: Props) {
  const sections = editSections[app] || [];
  const matchingIndex = sections.findIndex(section => records(store, section).some(item => item.id === initialId));
  const [sectionIndex, setSectionIndex] = useState(matchingIndex < 0 ? 0 : matchingIndex);
  const section = sections[sectionIndex];
  const initialRecord = matchingIndex < 0 ? null : records(store, sections[matchingIndex]).find(item => item.id === initialId) || null;
  const [editingId, setEditingId] = useState<string | null>(initialRecord?.id || null);
  const [draft, setDraft] = useState<Record<string, unknown> | null>(initialRecord ? { ...initialRecord } : null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [readingImage, setReadingImage] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const update = (key: string, value: unknown) => setDraft(current => current ? { ...current, [key]: value } : current);

  const openForm = (record?: RecordValue) => {
    if (!section) return;
    const defaults = { ...section.defaults };
    for (const key of ['time', 'date', 'updated']) {
      if (Object.hasOwn(defaults, key)) defaults[key] = new Date().toLocaleString();
    }
    setDraft(record ? { ...record } : defaults);
    setEditingId(record?.id || null);
    setAudioFile(null);
    setPendingDelete(null);
    setError('');
  };

  const save = async () => {
    if (!section || !draft || saving || readingImage) return;
    const required = section.fields.find(f => f.required && !String(draft[f.key] ?? '').trim());
    if (required) { setError(`${required.label} is required.`); return; }
    setSaving(true);
    setError('');
    try {
      let nextRecord = { ...draft };
      if (section.key === 'contacts') {
        const name = String(nextRecord.name || '').trim();
        nextRecord.initials = name.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
      }
      if (section.key === 'messages') {
        const person = String(nextRecord.person || '').trim();
        nextRecord.initials = person.split(/\s+/).slice(0, 2).map(part => part[0]?.toUpperCase()).join('');
        const messages = nextRecord.messages as Array<{ text: string; time: string; from: string }> | undefined;
        if (messages?.length) nextRecord.preview = messages[messages.length - 1].text;
      }
      if (section.key === 'musicPlaylists') {
        nextRecord.songs = (Array.isArray(nextRecord.songs) ? nextRecord.songs : String(nextRecord.songs ?? '').split('\n')).map(song => String(song).trim()).filter(Boolean);
      }
      if (section.key === 'voice' && audioFile) {
        const uploaded = await uploadAudio(audioFile);
        nextRecord = { ...nextRecord, audioId: uploaded.audioId, durationSeconds: uploaded.durationSeconds,
          duration: `${Math.floor(uploaded.durationSeconds / 60)}:${String(Math.floor(uploaded.durationSeconds % 60)).padStart(2, '0')}` };
      }
      const id = editingId || `edit-${crypto.randomUUID()}`;
      commit(current => {
        const collection = current[section.key] as RecordValue[];
        if (editingId && !collection.some(item => item.id === editingId)) throw new Error('This record no longer exists.');
        const value = { ...nextRecord, id } as RecordValue;
        const next = editingId ? collection.map(item => item.id === id ? value : item) : [value, ...collection];
        return { ...current, [section.key]: next };
      });
      setDraft(null);
      setAudioFile(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  };

  const remove = () => {
    if (!section || !pendingDelete) return;
    try {
      const id = pendingDelete;
      commit(current => ({
        ...current,
        [section.key]: (current[section.key] as RecordValue[]).filter(item => item.id !== id),
      }));
      onDeleted?.(id);
      setPendingDelete(null);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not delete this record.');
    }
  };

  const readImage = (file: File, key: string) => {
    if (!file.type.startsWith('image/') || file.size > MAX_IMAGE_BYTES) {
      setError('Choose an image smaller than 1.5 MB.');
      return;
    }
    setReadingImage(true);
    const reader = new FileReader();
    reader.onload = () => { update(key, reader.result); setReadingImage(false); };
    reader.onerror = () => { setError('Could not read the image.'); setReadingImage(false); };
    reader.readAsDataURL(file);
  };

  const renderField = (f: EditorField) => {
    const value = draft?.[f.key];
    if (f.kind === 'checkbox') return <label key={f.key} className="flex items-center gap-3 text-sm text-white/70"><input type="checkbox" checked={Boolean(value)} onChange={e => update(f.key, e.target.checked)} className="accent-[#d98ca7]" />{f.label}</label>;
    if (f.kind === 'image') return <label key={f.key} className="block text-xs text-white/55">{f.label}
      {typeof value === 'string' && value && <img src={value} alt="Current image" className="mt-2 h-20 w-20 rounded-xl object-cover" />}
      <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) readImage(file, f.key); }} className="mt-2 w-full text-xs text-white/70" />
      <span className="mt-1 block text-[10px] text-white/35">Optional · max 1.5 MB</span>
    </label>;
    if (f.kind === 'audio') return <label key={f.key} className="block text-xs text-white/55">{f.label}
      <input type="file" accept="audio/wav,audio/x-wav,audio/mpeg,audio/mp4,audio/x-m4a,audio/ogg,audio/webm,.m4a,.mp3,.wav" onChange={e => setAudioFile(e.target.files?.[0] || null)} className="mt-2 w-full text-xs text-white/70" />
      <span className="mt-1 block text-[10px] text-white/35">{audioFile ? `Selected: ${audioFile.name}` : value ? 'Current audio stays unless replaced.' : 'No audio file. Generate audio in Voice Memos, or upload here.'}</span>
    </label>;
    if (f.kind === 'select') return <label key={f.key} className="block text-xs text-white/55">{f.label}
      <select value={String(value ?? '')} onChange={e => update(f.key, e.target.value)} className={`${inputClass} mt-1 bg-[#242030]`}>{f.options?.map(option => <option key={option}>{option}</option>)}</select>
    </label>;
    if (f.kind === 'contact') return <label key={f.key} className="block text-xs text-white/55">{f.label}
      <select value={String(value ?? '')} onChange={e => update(f.key, e.target.value)} className={`${inputClass} mt-1 bg-[#242030]`}><option value="">None</option>{store.contacts.map(contact => <option key={contact.id} value={contact.id}>{contact.name}</option>)}{Boolean(value) && !store.contacts.some(c => c.id === value) && <option value={String(value)}>Former contact ({String(value)})</option>}</select>
    </label>;
    return <label key={f.key} className="block text-xs text-white/55">{f.label}
      {f.kind === 'textarea'
        ? <textarea value={Array.isArray(value) ? value.join('\n') : String(value ?? '')} onChange={e => update(f.key, e.target.value)} rows={4} className={`${inputClass} mt-1 resize-y`} data-testid={`edit-field-${f.key}`} />
        : <input type={f.kind === 'number' ? 'number' : 'text'} value={String(value ?? '')} onChange={e => update(f.key, f.kind === 'number' ? Number(e.target.value) : e.target.value)} className={`${inputClass} mt-1`} data-testid={`edit-field-${f.key}`} />}
    </label>;
  };

  return <div className="fixed inset-0 z-40 flex items-end bg-black/55 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Edit mode manager">
    <div className="mx-auto flex max-h-[90dvh] w-full max-w-[402px] flex-col rounded-t-[30px] border-t border-white/15 bg-[#1b1828] text-[#f2ece5] shadow-2xl app-in">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div><p className="text-[10px] uppercase tracking-[.2em] text-[#dca4b1]">Edit Mode ON</p><h2 className="mt-1 font-serif text-2xl">{draft ? `${editingId ? 'Edit' : 'New'} ${section?.title || 'record'}` : `Manage ${app}`}</h2></div>
        <button onClick={onClose} aria-label="Close editor" className="rounded-full p-2 text-white/50 hover:bg-white/10"><X size={18} /></button>
      </div>
      <div className="scroll-thin overflow-y-auto p-5">
        {sections.length > 1 && !draft && <div className="mb-4 flex gap-2 overflow-x-auto">{sections.map((item, index) =>
          <button key={`${item.key}-${item.label}`} onClick={() => { setSectionIndex(index); setPendingDelete(null); setError(''); }} className={`shrink-0 rounded-full border px-3 py-2 text-[11px] ${index === sectionIndex ? 'border-[#d98ca7] text-[#efbac4]' : 'border-white/10 text-white/45'}`}>{item.label}</button>
        )}</div>}
        {error && <p role="alert" className="mb-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-xs text-red-200">{error}</p>}
        {!section ? <p className="text-sm text-white/50">This app has no editable records.</p> : draft ? <>
          <div className="space-y-4">{section.fields.map(renderField)}</div>
          {section.key === 'messages' && <div className="mt-5 border-t border-white/10 pt-4">
            <p className="mb-3 text-xs text-white/60">Messages in this conversation</p>
            {((draft.messages as Array<{ from: 'me' | 'them'; text: string; time: string }> | undefined) || []).map((message, index) =>
              <div key={index} className="mb-3 rounded-xl border border-white/10 p-3">
                <div className="flex items-center justify-between"><select value={message.from} onChange={e => update('messages', (draft.messages as typeof message[]).map((item, i) => i === index ? { ...item, from: e.target.value } : item))} className="bg-[#242030] text-xs text-white"><option value="me">Me</option><option value="them">Them</option></select><button onClick={() => update('messages', (draft.messages as typeof message[]).filter((_, i) => i !== index))} aria-label="Remove message"><Trash2 size={14} /></button></div>
                <textarea aria-label={`Message ${index + 1} text`} value={message.text} onChange={e => update('messages', (draft.messages as typeof message[]).map((item, i) => i === index ? { ...item, text: e.target.value } : item))} rows={2} className={`${inputClass} mt-2`} />
                <input aria-label={`Message ${index + 1} time`} value={message.time} onChange={e => update('messages', (draft.messages as typeof message[]).map((item, i) => i === index ? { ...item, time: e.target.value } : item))} className={`${inputClass} mt-2`} />
              </div>
            )}
            <button onClick={() => update('messages', [...((draft.messages as unknown[]) || []), { from: 'me', text: '', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])} className="text-xs text-[#e7aabb]">+ Add message</button>
          </div>}
          {section.key === 'voice' && editingId && <p className="mt-3 text-[11px] text-white/45">Editing a transcript does not change existing audio. Use Generate Audio in Voice Memos to update its speech.</p>}
          <div className="mt-6 flex gap-3"><button onClick={() => { setDraft(null); setAudioFile(null); setError(''); }} disabled={saving || readingImage} className="flex-1 rounded-xl border border-white/15 py-3 text-sm">Cancel</button><button onClick={save} disabled={saving || readingImage} className="flex-1 rounded-xl bg-[#d98ca7] py-3 text-sm text-[#291d26] disabled:opacity-50" data-testid="button-save-edit">{saving || readingImage ? 'Saving…' : 'Save'}</button></div>
        </> : <>
          <button onClick={() => openForm()} className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-[#d98ca7]/50 py-3 text-sm text-[#e7aabb]" data-testid="button-new-edit-record"><Plus size={15} /> New {section.title}</button>
          <div className="space-y-2">{records(store, section).map(record => <div key={record.id} className="rounded-xl border border-white/10 bg-white/[.045] p-3">
            <p className="min-w-0 break-words text-sm">{labelFor(record, section)}</p>
            {pendingDelete === record.id ? <div className="mt-3"><p className="text-xs text-white/80">Delete this {section.title}?</p><div className="mt-2 flex gap-3"><button onClick={() => setPendingDelete(null)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs">Cancel</button><button onClick={remove} className="rounded-lg bg-red-500/20 px-3 py-1.5 text-xs text-red-200">Delete</button></div></div> : <div className="mt-2 flex gap-4"><button onClick={() => openForm(record)} className="flex items-center gap-1 text-xs text-[#e7aabb]" aria-label={`Edit ${labelFor(record, section)}`}><Pencil size={13} /> Edit</button><button onClick={() => setPendingDelete(record.id)} className="flex items-center gap-1 text-xs text-white/45" aria-label={`Delete ${labelFor(record, section)}`}><Trash2 size={13} /> Delete</button></div>}
          </div>)}</div>
          {!records(store, section).length && <p className="text-center text-xs text-white/40">Nothing here yet.</p>}
        </>}
      </div>
      {draft && <button onClick={() => { setDraft(null); setAudioFile(null); setError(''); }} className="sr-only"><ArrowLeft /> Back to records</button>}
    </div>
  </div>;
}