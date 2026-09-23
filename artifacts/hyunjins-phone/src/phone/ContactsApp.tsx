import { useEffect, useState, type ChangeEvent } from 'react';
import { ArrowLeft, ChevronRight, Image, MessageCircle, Pencil, Phone as PhoneIcon, Plus, Star, Trash2 } from 'lucide-react';
import type { Contact, PhoneStore } from './config';
import { createContact } from './createContact';
import { Avatar } from './NewApps';

type Detail = { kind: string; id: string } | null;
type Props = {
  store: PhoneStore;
  detail: Detail;
  setDetail: (d: Detail) => void;
  editMode: boolean;
  commit: (update: (s: PhoneStore) => PhoneStore) => void;
};

type Draft = Omit<Contact, 'id' | 'initials'>;
const blankDraft = (): Draft => ({
  name: '', role: '', context: '', color: '#8da5bd', firstName: '', lastName: '',
  nickname: '', relationship: '', notes: '', favorite: false, photoDataUrl: '',
});
const displayName = (c: Contact) => c.name || c.nickname || [c.firstName, c.lastName].filter(Boolean).join(' ') || 'Unnamed contact';
const initialsFor = (name: string) => name.split(/\s+/).filter(Boolean).slice(0, 2).map(x => x[0].toUpperCase()).join('') || '?';

export function ContactsApp({ store, detail, setDetail, editMode, commit }: Props) {
  const contact = detail?.kind === 'contact' ? store.contacts.find(c => c.id === detail.id) : undefined;
  const [editing, setEditing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Contact | null>(null);
  const [readingPhoto, setReadingPhoto] = useState(false);

  useEffect(() => {
    if (contact && !editing) setDraft({ ...blankDraft(), ...contact });
  }, [contact?.id, editing]);

  const beginNew = () => {
    setError(''); setCreating(true); setEditing(true); setDetail(null); setDraft(blankDraft());
  };
  const beginEdit = (c: Contact) => {
    setError(''); setCreating(false); setEditing(true); setDetail({ kind: 'contact', id: c.id }); setDraft({ ...blankDraft(), ...c });
  };
  const update = (key: keyof Draft, value: string | boolean) => setDraft(current => ({ ...current, [key]: value }));
  const save = () => {
    if (readingPhoto) return;
    setError('');
    try {
      const normalizedName = draft.name.trim() || [draft.firstName, draft.lastName].filter(Boolean).join(' ').trim();
      if (!normalizedName) throw new Error('A contact needs a name.');
      const nextDraft = { ...draft, name: normalizedName, initials: initialsFor(normalizedName) };
      if (creating) {
        let createdId = '';
        commit(s => {
          const next = createContact(s, nextDraft);
          createdId = next.contacts[0].id;
          return next;
        });
        setCreating(false); setEditing(false);
        setDetail({ kind: 'contact', id: createdId });
      } else if (contact) {
        commit(s => ({ ...s, contacts: s.contacts.map(c => c.id === contact.id ? { ...c, ...nextDraft, id: c.id, initials: initialsFor(normalizedName) } : c) }));
        setEditing(false);
        setDetail(null);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Unable to save this contact.'); }
  };
  const remove = (c: Contact) => {
    setPendingDelete(c);
  };
  const confirmRemove = () => {
    if (!pendingDelete) return;
    setError('');
    try { commit(s => ({ ...s, contacts: s.contacts.filter(x => x.id !== pendingDelete.id) })); setPendingDelete(null); setDetail(null); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to delete this contact.'); }
  };
  const photo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 1_500_000) { setError('Choose an image smaller than 1.5 MB.'); return; }
    setReadingPhoto(true);
    const reader = new FileReader();
    reader.onload = () => { update('photoDataUrl', String(reader.result || '')); setReadingPhoto(false); };
    reader.onerror = () => { setError('Unable to read this photo.'); setReadingPhoto(false); };
    reader.readAsDataURL(file);
  };
  if (editing) return <ContactForm draft={draft} update={update} save={save} cancel={() => { setEditing(false); setCreating(false); }} photo={photo} error={error} creating={creating} readingPhoto={readingPhoto} />;
  const confirmation = pendingDelete && <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/65 px-6" role="alertdialog" aria-modal="true" aria-label="Delete this contact?"><div className="w-full max-w-[340px] rounded-3xl border border-white/15 bg-[#1b1828] p-5 shadow-2xl"><h2 className="font-serif text-xl">Delete this contact?</h2><p className="mt-2 text-xs text-white/55">{pendingDelete.name} will be removed from Contacts. Past messages and calls will remain.</p>{error && <p role="alert" className="mt-3 text-xs text-red-200">{error}</p>}<div className="mt-5 flex justify-end gap-3"><button onClick={() => { setPendingDelete(null); setError(''); }} className="rounded-xl border border-white/15 px-4 py-2 text-xs">Cancel</button><button onClick={confirmRemove} className="rounded-xl bg-red-400/20 px-4 py-2 text-xs text-red-200" data-testid="button-confirm-delete-contact">Delete</button></div></div></div>;
  if (contact) return <><ContactDetail contact={contact} editMode={editMode} onBack={() => setDetail(null)} onEdit={() => beginEdit(contact)} onDelete={() => remove(contact)} error={error} />{confirmation}</>;
  return <><ContactList contacts={store.contacts} editMode={editMode} onSelect={c => setDetail({ kind: 'contact', id: c.id })} onEdit={beginEdit} onDelete={remove} onNew={beginNew} error={error} />{confirmation}</>;
}

function ContactList({ contacts, editMode, onSelect, onEdit, onDelete, onNew, error }: { contacts: Contact[]; editMode: boolean; onSelect: (c: Contact) => void; onEdit: (c: Contact) => void; onDelete: (c: Contact) => void; onNew: () => void; error: string }) {
   return <div><div className="mb-7 flex items-end justify-between"><div><p className="text-xs text-white/45">people kept close</p><h1 className="mt-1 font-serif text-4xl">Contacts</h1></div>{editMode && <button onClick={onNew} className="flex items-center gap-1 rounded-xl bg-[#d98ca7] px-3 py-2 text-xs text-[#2b1d27]" data-testid="button-contact-new"><Plus size={14} /> New Contact</button>}</div>{error && <p className="mb-4 rounded-xl border border-red-300/30 bg-red-400/10 p-3 text-xs text-red-200" role="alert">{error}</p>}<div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-white/40">search people</div><div className="space-y-2">{contacts.map(c => <div key={c.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.045] p-4" data-testid={`card-contact-${c.id}`}><button onClick={() => onSelect(c)} className="flex min-w-0 flex-1 items-center gap-3 text-left">{c.photoDataUrl ? <img src={c.photoDataUrl} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" /> : <Avatar initials={c.initials} color={c.color} />}<span className="min-w-0 flex-1"><b className="block truncate text-sm">{displayName(c)} {c.favorite && <Star size={11} fill="#e7b967" className="inline text-[#e7b967]" />}</b><small className="mt-1 block truncate text-[10px] text-white/40">{c.role} · {c.context}</small></span><ChevronRight size={15} className="text-white/25" /></button>{editMode && <span className="flex gap-1"><button onClick={() => onEdit(c)} className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-[10px]" data-testid={`button-contact-edit-${c.id}`}><Pencil size={12} /> Edit</button><button onClick={() => onDelete(c)} className="flex items-center gap-1 rounded-lg border border-red-300/25 px-2 py-1 text-[10px] text-red-200" data-testid={`button-contact-delete-${c.id}`}><Trash2 size={12} /> Delete</button></span>}</div>)}</div></div>;
}

function ContactDetail({ contact: c, editMode, onBack, onEdit, onDelete, error }: { contact: Contact; editMode: boolean; onBack: () => void; onEdit: () => void; onDelete: () => void; error: string }) {
  return <div><button onClick={onBack} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]" data-testid="button-contact-back"><ArrowLeft size={15} /> contacts</button>{error && <p className="mb-4 rounded-xl bg-red-400/10 p-3 text-xs text-red-200" role="alert">{error}</p>}<div className="flex flex-col items-center text-center">{c.photoDataUrl ? <img src={c.photoDataUrl} className="h-24 w-24 rounded-full object-cover" alt="" /> : <Avatar initials={c.initials} color={c.color} size="lg" />}<h1 className="mt-4 font-serif text-3xl">{displayName(c)}</h1><p className="mt-1 text-xs text-white/45">{c.role} · {c.context}</p><div className="mt-5 flex gap-3"><button className="flex items-center gap-2 rounded-xl bg-[#d98ca7] px-4 py-2 text-xs text-[#2b1d27]" data-testid="button-contact-message"><MessageCircle size={14} /> message</button><button className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-xs" data-testid="button-contact-call"><PhoneIcon size={14} /> call</button></div>{editMode && <div className="mt-3 flex gap-2"><button onClick={onEdit} className="flex items-center gap-1 rounded-xl border border-white/15 px-3 py-2 text-xs" data-testid="button-contact-detail-edit"><Pencil size={13} /> Edit</button><button onClick={onDelete} className="flex items-center gap-1 rounded-xl border border-red-300/25 px-3 py-2 text-xs text-red-200" data-testid="button-contact-detail-delete"><Trash2 size={13} /> Delete</button></div>}</div><div className="mt-10 rounded-3xl border border-white/10 bg-white/[.045] p-5"><p className="text-[10px] uppercase tracking-[.2em] text-white/35">context note</p><p className="mt-3 text-sm leading-6 text-white/65">{c.notes || (c.id.startsWith('contact-') ? c.context : c.name === 'Antonella' ? 'Remember the tiny cinema in Euljiro. She likes the seats in the back row.' : 'A good person to have nearby when a project gets complicated.')}</p></div></div>;
}

function ContactForm({ draft, update, save, cancel, photo, error, creating, readingPhoto }: { draft: Draft; update: (key: keyof Draft, value: string | boolean) => void; save: () => void; cancel: () => void; photo: (e: ChangeEvent<HTMLInputElement>) => void; error: string; creating: boolean; readingPhoto: boolean }) {
  const field = (key: keyof Draft, label: string) => <label className="block"><span className="mb-1 block text-[10px] uppercase tracking-wider text-white/45">{label}</span><input value={String(draft[key] || '')} onChange={e => update(key, e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none focus:border-[#d98ca7]" data-testid={`input-contact-${key}`} /></label>;
   return <div><button onClick={cancel} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]"><ArrowLeft size={15} /> contacts</button><h1 className="mb-6 font-serif text-4xl">{creating ? 'New Contact' : 'Edit Contact'}</h1>{error && <p className="mb-4 rounded-xl bg-red-400/10 p-3 text-xs text-red-200" role="alert">{error}</p>}<div className="space-y-4">{field('name', 'Display name')}{field('firstName', 'First name')}{field('lastName', 'Last name')}{field('nickname', 'Nickname')}{field('relationship', 'Relationship')}{field('role', 'Role')}{field('context', 'Context')}{field('notes', 'Notes')}<label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={Boolean(draft.favorite)} onChange={e => update('favorite', e.target.checked)} data-testid="input-contact-favorite" /> Favorite</label><label className="block text-xs text-white/60"><span className="mb-2 block">Photo</span><input type="file" accept="image/*" onChange={photo} data-testid="input-contact-photo" />{draft.photoDataUrl && <img src={draft.photoDataUrl} alt="Preview" className="mt-3 h-20 w-20 rounded-xl object-cover" />}</label><div className="flex gap-2 pt-2"><button onClick={save} disabled={readingPhoto} className="rounded-xl bg-[#d98ca7] px-4 py-2 text-xs text-[#2b1d27] disabled:opacity-50" data-testid="button-contact-save">{readingPhoto ? 'Reading photo…' : 'Save'}</button><button onClick={cancel} className="rounded-xl border border-white/15 px-4 py-2 text-xs" data-testid="button-contact-cancel">Cancel</button></div></div></div>;
}