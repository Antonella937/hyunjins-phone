export const characterProfile = {
  name: 'Hyunjin',
  handle: '@hyune.studio',
  city: 'Seoul, KR',
  accent: '#d98ca7',
  accentSoft: '#f3c4c7',
  wallpaper: 'aurora',
  tagline: 'small evidence of a life in motion',
};

export type PhoneMessage = { id: string; person: string; initials: string; preview: string; time: string; unread?: number; pinned?: boolean; color: string; messages: { from: 'me' | 'them'; text: string; time: string; kind?: 'photo' | 'voice' }[] };
export type DiaryEntry = { id: string; date: string; title: string; mood: string; body: string };
export type QuickNote = { id: string; text: string; time: string; color: string };
export type CalendarEvent = { id: string; day: number; title: string; time: string; kind: string };
export type Contact = { id: string; name: string; initials: string; role: string; context: string; color: string };
export type GalleryItem = { id: string; title: string; album: string; date: string; caption: string; tone: string; favorite?: boolean };
export type Post = { id: string; user: string; caption: string; time: string; tone: string; likes: number; saved?: boolean };
export type VoiceMemo = { id: string; title: string; date: string; duration: string; transcript: string; private?: boolean };

export const seedPhone = {
  messages: [
    { id: 'antonella', person: 'Antonella', initials: 'A', preview: 'leave the lamp on for me?', time: '22:48', unread: 2, pinned: true, color: '#d895a6', messages: [{ from: 'them', text: 'did you eat anything after rehearsal?', time: '22:40' }, { from: 'me', text: 'a very serious banana. does that count?', time: '22:42' }, { from: 'them', text: 'barely. leave the lamp on for me?', time: '22:48' }] },
    { id: 'mar', person: 'Mar', initials: 'M', preview: 'the blue one feels more like you', time: '20:16', unread: 1, color: '#e6b36a', messages: [{ from: 'me', text: 'sent the three cover studies.', time: '20:01' }, { from: 'them', text: 'the blue one feels more like you', time: '20:16' }] },
    { id: 'noah', person: 'Noah', initials: 'N', preview: 'call time moved to 7:30', time: '18:02', color: '#a1b6d4', messages: [{ from: 'them', text: 'call time moved to 7:30. sorry.', time: '18:02' }] },
    { id: 'mira', person: 'Mira / Studio', initials: 'MS', preview: 'the film scans are in Files', time: 'yesterday', color: '#9dbb9c', messages: [{ from: 'them', text: 'the film scans are in Files — folder is called After Rain.', time: 'yesterday' }] },
    { id: 'mum', person: 'Mum', initials: 'M', preview: '잘 자, 우리 아들', time: 'Mon', color: '#caa1bb', messages: [{ from: 'them', text: '잘 자, 우리 아들', time: 'Mon' }] },
  ] as PhoneMessage[],
  diary: [
    { id: 'd1', date: '28 May 2024', title: 'The hour after rain', mood: 'quiet / grateful', body: 'The city looked newly washed from the van window. Somewhere near Hannam, the sky held the last blue like it was keeping a secret. I kept thinking about how a song can be a room you return to.\\n\\nAntonella sent a photograph of two cups on a windowsill. No message, just the photograph. I understood it perfectly.' },
    { id: 'd2', date: '21 May 2024', title: 'A softer kind of tired', mood: 'worn / warm', body: 'Rehearsal was all edges today. I came home with the counts still moving in my shoulders. Made tea, played the same piano loop, and let the room be quiet around me.' },
    { id: 'd3', date: '14 May 2024', title: '', mood: 'restless', body: 'There are too many ideas and not enough hands. This is probably a good problem.' },
  ] as DiaryEntry[],
  quickNotes: [
    { id: 'q1', text: 'ask Antonella about the little cinema in Euljiro', time: '11 min ago', color: '#d895a6' },
    { id: 'q2', text: '“silver after rain” — maybe a title', time: 'yesterday', color: '#e6b36a' },
    { id: 'q3', text: 'buy a cable for the old projector', time: 'Mon', color: '#9dbb9c' },
  ] as QuickNote[],
  events: [
    { id: 'e1', day: 4, title: 'dance rehearsal', time: '10:00 — 18:00', kind: 'work' },
    { id: 'e2', day: 8, title: 'call with Buenos Aires', time: '21:30', kind: 'personal' },
    { id: 'e3', day: 12, title: 'Mira — film scans', time: '14:00', kind: 'studio' },
    { id: 'e4', day: 17, title: 'Antonella / dinner', time: '20:00', kind: 'personal' },
    { id: 'e5', day: 24, title: 'flight to Tokyo', time: '08:45', kind: 'travel' },
  ] as CalendarEvent[],
  contacts: [
    { id: 'c1', name: 'Antonella', initials: 'A', role: 'favorite person', context: 'Buenos Aires ↔ Seoul · 4 years', color: '#d895a6' },
    { id: 'c2', name: 'Mar Rivera', initials: 'MR', role: 'creative director', context: 'Hyune Studio · work', color: '#e6b36a' },
    { id: 'c3', name: 'Noah Kim', initials: 'NK', role: 'tour manager', context: 'work · Seoul', color: '#a1b6d4' },
    { id: 'c4', name: 'Mira Choi', initials: 'MC', role: 'photographer', context: 'studio friends', color: '#9dbb9c' },
  ] as Contact[],
  gallery: [
    { id: 'g1', title: 'window, 22:17', album: 'Antonella', date: '28 May 2024 · 22:17', caption: 'two cups and the weather turning silver', tone: 'rose', favorite: true },
    { id: 'g2', title: 'after rain', album: 'Seoul', date: '28 May 2024 · 18:42', caption: 'near Hannam, on the way home', tone: 'blue' },
    { id: 'g3', title: 'hands / study 04', album: 'Sketches', date: '24 May 2024 · 02:09', caption: 'charcoal on cream paper', tone: 'ink' },
    { id: 'g4', title: 'no title', album: 'Friends', date: '19 May 2024 · 16:20', caption: 'Mira laughing before the take', tone: 'green' },
    { id: 'g5', title: 'blue hour', album: 'Favorites', date: '12 May 2024 · 20:03', caption: 'the Han from the practice room', tone: 'violet', favorite: true },
    { id: 'g6', title: 'reference / glass', album: 'Art & Design', date: '08 May 2024 · 13:18', caption: 'texture reference for the next set', tone: 'amber' },
  ] as GalleryItem[],
  posts: [
    { id: 'p1', user: 'hyune.studio', caption: 'somewhere between blue hour and the last train.', time: '2h', tone: 'blue', likes: 1248, saved: true },
    { id: 'p2', user: 'hyune.studio', caption: 'new shapes, old paper. working title: after rain.', time: '4d', tone: 'rose', likes: 892 },
    { id: 'p3', user: 'mar.rivera', caption: 'the studio has been very quiet lately.', time: '1w', tone: 'amber', likes: 341 },
  ] as Post[],
  voice: [
    { id: 'v1', title: 'melody in the kitchen', date: 'Today, 00:32', duration: '01:18', transcript: 'a small melody, recorded before it disappears', private: true },
    { id: 'v2', title: 'for Antonella', date: '23 May 2024', duration: '00:42', transcript: 'I saw the moon from the practice room window. It looked like your side of the world.', },
    { id: 'v3', title: 'bridge idea / take 2', date: '17 May 2024', duration: '02:36', transcript: 'a low piano figure with a held note at the end', private: true },
  ] as VoiceMemo[],
};

export type PhoneStore = typeof seedPhone;