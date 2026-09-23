import type { PhoneStore } from './config';

export type EditableCollection = Exclude<keyof PhoneStore, 'canon' | 'publishedProposalIds'>;
export type EditorField = {
  key: string;
  label: string;
  kind?: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'contact' | 'image' | 'audio';
  options?: string[];
  required?: boolean;
};
export type EditorSection = {
  key: EditableCollection;
  label: string;
  title: string;
  fields: EditorField[];
  defaults: Record<string, unknown>;
  include?: (record: Record<string, unknown>) => boolean;
};

const field = (key: string, label: string, kind: EditorField['kind'] = 'text', required = false): EditorField => ({ key, label, kind, required });
const time = () => new Date().toLocaleString();
const section = (key: EditableCollection, label: string, title: string, fields: EditorField[], defaults: Record<string, unknown>): EditorSection => ({ key, label, title, fields, defaults });

const callFields: EditorField[] = [
  field('name', 'Name', 'text', true), field('contactId', 'Related contact', 'contact'), field('number', 'Number'),
  field('time', 'Date / time'), field('duration', 'Duration'), field('missed', 'Missed', 'checkbox'),
  { key: 'type', label: 'Call type', kind: 'select', options: ['audio', 'video', 'voicemail'] },
];
const historyFields = [field('title', 'Title', 'text', true), field('url', 'URL'), field('time', 'Date / time')];
const echoFields: EditorField[] = [
  field('author', 'Author', 'text', true), field('handle', 'Handle'), field('content', 'Post text', 'textarea', true),
  field('time', 'Date / time'), field('likes', 'Likes', 'number'), field('reposts', 'Reposts', 'number'), field('replies', 'Replies', 'number'),
];

export const editSections: Record<string, EditorSection[]> = {
  contacts: [section('contacts', 'Contacts', 'contact', [
    field('name', 'Display name', 'text', true), field('firstName', 'First name'), field('lastName', 'Last name'),
    field('nickname', 'Nickname'), field('relationship', 'Relationship'), field('role', 'Role'),
    field('context', 'Context'), field('notes', 'Notes', 'textarea'), field('favorite', 'Favorite', 'checkbox'),
    field('photoDataUrl', 'Contact photo', 'image'),
  ], { name: '', firstName: '', lastName: '', nickname: '', relationship: '', role: '', context: '', notes: '', favorite: false, color: '#8da5bd' })],
  phone: [
    section('calls', 'Calls', 'call', callFields, { name: '', time: time(), type: 'audio', missed: false }),
    section('calls', 'Voicemails', 'voicemail', callFields, { name: '', time: time(), type: 'voicemail', missed: false }),
  ],
  messages: [
    section('messages', 'Conversations', 'conversation', [
      field('person', 'Contact name', 'text', true), field('time', 'Date / time'), field('preview', 'Preview text', 'textarea'),
      field('pinned', 'Pinned', 'checkbox'), field('unread', 'Unread count', 'number'),
    ], { person: '', preview: '', time: time(), messages: [], unread: 0, color: '#d895a6' }),
  ],
  instagram: [
    section('posts', 'Posts', 'post', [field('user', 'Account', 'text', true), field('caption', 'Caption', 'textarea', true), field('time', 'Date / time'), field('likes', 'Likes', 'number'), field('saved', 'Saved', 'checkbox'), field('dataUrl', 'Image', 'image')], { user: 'hyune.studio', caption: '', time: time(), tone: 'rose', likes: 0 }),
    section('instagramStories', 'Stories', 'story', [field('user', 'Account', 'text', true), field('caption', 'Caption', 'textarea'), field('time', 'Date / time'), field('dataUrl', 'Image', 'image')], { user: 'hyune.studio', caption: '', time: time() }),
  ],
  echo: [
    section('echoPosts', 'Posts', 'Echo post', echoFields, { author: 'hyune', handle: '@hyune', content: '', time: time(), likes: 0, reposts: 0, replies: 0 }),
    section('echoDrafts', 'Drafts', 'Echo draft', echoFields, { author: 'hyune', handle: '@hyune', content: '', time: time(), likes: 0, reposts: 0, replies: 0 }),
  ],
  gallery: [section('gallery', 'Gallery', 'photo', [
    field('title', 'Title', 'text', true), field('caption', 'Caption', 'textarea'), field('album', 'Album'), field('date', 'Date / time'),
    field('favorite', 'Favorite', 'checkbox'), field('dataUrl', 'Image', 'image'),
  ], { title: '', caption: '', album: 'Favorites', date: time(), tone: 'rose', favorite: false })],
  voice: [section('voice', 'Voice Memos', 'voice memo', [
    field('title', 'Title', 'text', true), field('transcript', 'Transcript', 'textarea', true), field('date', 'Date / time'),
    field('category', 'Category'), field('relatedContactId', 'Related contact', 'contact'), field('context', 'Context'),
    field('audioId', 'Audio file', 'audio'),
  ], { title: '', transcript: '', date: time(), duration: '—', private: true, language: 'English' })],
  diary: [section('diary', 'Diary', 'diary entry', [
    field('title', 'Title'), field('body', 'Full entry', 'textarea', true), field('date', 'Date / time'), field('mood', 'Mood'),
  ], { title: '', body: '', date: time(), mood: 'quiet' })],
  quick: [section('quickNotes', 'Quick Notes', 'quick note', [field('text', 'Text', 'textarea', true), field('time', 'Date / time')], { text: '', time: time(), color: '#d895a6' })],
  notes: [section('notes', 'Notes', 'note', [field('title', 'Title', 'text', true), field('body', 'Full note', 'textarea', true), field('meta', 'Date / details')], { title: '', body: '', meta: time(), color: '#dfad7b' })],
  calendar: [section('events', 'Calendar', 'event', [
    field('title', 'Title', 'text', true), field('day', 'Day of month', 'number'), field('time', 'Time'), field('kind', 'Category'),
  ], { title: '', day: new Date().getDate(), time: '12:00', kind: 'personal' })],
  places: [section('places', 'Places', 'place', [
    field('name', 'Name', 'text', true), field('location', 'Location'), field('category', 'Category'), field('notes', 'Notes', 'textarea'), field('saved', 'Saved', 'checkbox'),
  ], { name: '', location: '', category: 'important locations', notes: '', saved: true })],
  browser: [
    section('browserHistory', 'History', 'history entry', historyFields, { title: '', url: '', time: time() }),
    section('browserSearches', 'Searches', 'search', historyFields, { title: '', url: '', time: time() }),
    section('browserBookmarks', 'Bookmarks', 'bookmark', historyFields.slice(0, 2), { title: '', url: '' }),
    section('browserTabs', 'Tabs', 'tab', [...historyFields.slice(0, 2), field('active', 'Active', 'checkbox')], { title: '', url: '', active: false }),
  ],
  music: [
    section('musicPlaylists', 'Playlists', 'playlist', [
      field('name', 'Name', 'text', true), field('songs', 'Songs (one per line)', 'textarea'),
    ], { name: '', songs: '' }),
    section('musicActivity', 'Music Activity', 'music activity', [
      field('title', 'Title', 'text', true), field('content', 'Details', 'textarea'), field('time', 'Date / time'),
    ], { title: '', content: '', time: time() }),
  ],
  studio: [section('studioProjects', 'Studio', 'project', [
    field('title', 'Title', 'text', true), { key: 'status', label: 'Status', kind: 'select', options: ['idea', 'demo', 'unfinished', 'finished'] },
    field('updated', 'Date / time'), field('metadata', 'Details', 'textarea'), field('duration', 'Duration'),
  ], { title: '', status: 'idea', updated: time(), metadata: '', hasAudio: false })],
  files: [section('files', 'Files', 'file record', [
    field('name', 'Name', 'text', true), field('folder', 'Folder'), field('type', 'Type'), field('date', 'Date / time'),
  ], { name: '', folder: 'Documents', type: 'document', date: time() })],
  notifications: [section('notifications', 'Notifications', 'notification', [
    field('title', 'Title', 'text', true), field('sub', 'Details', 'textarea'), field('time', 'Date / time'), field('icon', 'Icon'),
  ], { title: '', sub: '', time: time(), icon: 'message', color: '#d895a6' })],
};

editSections.phone[0].include = record => record.type !== 'voicemail';
editSections.phone[1].include = record => record.type === 'voicemail';