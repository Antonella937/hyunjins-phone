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
export type GalleryItem = { id: string; title: string; album: string; date: string; caption: string; tone: string; favorite?: boolean; dataUrl?: string };
export type Post = { id: string; user: string; caption: string; time: string; tone: string; likes: number; saved?: boolean; dataUrl?: string };
export type VoiceMemo = { id: string; title: string; date: string; duration: string; transcript: string; private?: boolean };
export type Note = { id: string; title: string; meta: string; color: string; body: string };
export type AppNotification = { id: string; icon: string; title: string; sub: string; color: string; time: string };
export type FileItem = { id: string; name: string; folder: string; type: string; date: string };
export type CallRecord = { id: string; contactId?: string; number?: string; name?: string; time: string; duration?: string; missed?: boolean; type: 'audio' | 'video' | 'voicemail' };
export type BrowserTab = { id: string; url: string; title: string; active?: boolean; private?: boolean };
export type BrowserHistory = { id: string; url: string; title: string; time: string };
export type BrowserBookmark = { id: string; url: string; title: string };
export type EchoPost = { id: string; author: string; handle: string; content: string; time: string; likes: number; reposts: number; replies: number; isRepost?: boolean; isLiked?: boolean; isReposted?: boolean };
export type EchoNotification = { id: string; type: 'like' | 'repost' | 'reply' | 'mention'; user: string; text: string; time: string };
export type StudioProject = { id: string; title: string; status: 'demo' | 'unfinished' | 'finished' | 'idea'; updated: string; metadata: string; duration?: string; hasAudio?: boolean };
export type Place = { id: string; name: string; category: string; location: string; notes?: string; saved?: boolean };
export type InstagramStory = { id: string; user: string; caption: string; time: string; dataUrl?: string; source?: 'ai-generated' };
export type MusicActivity = { id: string; title: string; content: string; time: string; source?: 'ai-generated' };

export type Canon = {
  character: string;
  currentLocation: string;
  relationships: string;
  friends: string;
  contacts: string;
  importantMemories: string;
  recentEvents: string;
  currentProjects: string;
  preferences: string;
  recurringPlaces: string;
  importantDates: string;
  ongoingStorylines: string;
  relationshipHistory: string;
  masterTimeline: string;
};

export const seedCanon: Canon = {
  character: "Hyunjin. Observant, quiet but intense creatively. Works late, notices small details like light and texture. Overthinks slightly. Cherishes quiet spaces.",
  currentLocation: "Seoul, mostly Hannam and their studio. Sometimes travels for tours.",
  relationships: "Antonella is a deeply important, long-distance connection in Buenos Aires. It's built on shared silence, unsaid understandings, and sending small observations of their day to each other.",
  friends: "Mira (photographer, sees through the noise), Mar (creative director, practical, keeps Hyunjin grounded), Noah (tour manager, handles the chaos).",
  contacts: "Antonella, Mira, Mar, Noah.",
  importantMemories: "A rainy evening in Buenos Aires. The first time the studio felt like a real home. A particular midnight walk near the Han River.",
  recentEvents: "Just finished a grueling dance rehearsal. Looking through film scans with Mira. Preparing for an upcoming trip to Tokyo.",
  currentProjects: "Working on a set design titled 'after rain' using translucent paper and silver. A new untitled music track.",
  preferences: "Loves film photography, ambient/low lighting, silver jewelry, tea over coffee. Prefers written texts over calls unless it's someone very close.",
  recurringPlaces: "Hyune Studio, a tiny cinema in Euljiro, practice rooms, flights, late-night cafes.",
  importantDates: "24 May (Flight to Tokyo), 28 May (The hour after rain).",
  ongoingStorylines: "The creative tension of finishing the 'after rain' set design. The long-distance pull with Antonella and the time difference.",
  relationshipHistory: "Antonella and Hyunjin have known each other for 4 years. Met by chance during a schedule in South America.",
  masterTimeline: "May 2024: Current. Deep in creative work, navigating personal connections from a distance."
};

export const seedPhone = {
  messages: [
    { id: 'antonella', person: 'Antonella', initials: 'A', preview: 'leave the lamp on for me?', time: '22:48', unread: 2, pinned: true, color: '#d895a6', messages: [{ from: 'them', text: 'did you eat anything after rehearsal?', time: '22:40' }, { from: 'me', text: 'a very serious banana. does that count?', time: '22:42' }, { from: 'them', text: 'barely. leave the lamp on for me?', time: '22:48' }] },
    { id: 'mar', person: 'Mar', initials: 'M', preview: 'the blue one feels more like you', time: '20:16', unread: 1, color: '#e6b36a', messages: [{ from: 'me', text: 'sent the three cover studies.', time: '20:01' }, { from: 'them', text: 'the blue one feels more like you', time: '20:16' }] },
    { id: 'noah', person: 'Noah', initials: 'N', preview: 'call time moved to 7:30', time: '18:02', color: '#a1b6d4', messages: [{ from: 'them', text: 'call time moved to 7:30. sorry.', time: '18:02' }] },
    { id: 'mira', person: 'Mira / Studio', initials: 'MS', preview: 'the film scans are in Files', time: 'yesterday', color: '#9dbb9c', messages: [{ from: 'them', text: 'the film scans are in Files — folder is called After Rain.', time: 'yesterday' }] },
    { id: 'mum', person: 'Mum', initials: 'M', preview: '잘 자, 우리 아들', time: 'Mon', color: '#caa1bb', messages: [{ from: 'them', text: '잘 자, 우리 아들', time: 'Mon' }] },
  ] as PhoneMessage[],
  diary: [
    { id: 'd1', date: '28 May 2024', title: 'The hour after rain', mood: 'quiet / grateful', body: 'The city looked newly washed from the van window. Somewhere near Hannam, the sky held the last blue like it was keeping a secret. I kept thinking about how a song can be a room you return to.\n\nAntonella sent a photograph of two cups on a windowsill. No message, just the photograph. I understood it perfectly.' },
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
  notes: [
    { id: 'n1', title: 'things to make when we have time', meta: '12 lines · edited today', color: '#dfad7b', body: 'A room with one very low light.\nA book cover that feels like rain.\nFilm photographs from every city after midnight.' }, 
    { id: 'n2', title: 'set design — after rain', meta: '24 lines · edited yesterday', color: '#9cb4c2', body: 'Use translucent paper, hard shadows, one silver chair. Let the empty space do most of the work.' }, 
    { id: 'n3', title: 'lyrics / fragments', meta: '8 lines · edited 24 May', color: '#d79bb0', body: 'If the night keeps its promises / I will leave the window open.' }, 
    { id: 'n4', title: 'packing list / Tokyo', meta: '16 lines · edited 21 May', color: '#a5bd9b', body: 'old camera, black notebook, cable, two shirts, the little stone.' }
  ] as Note[],
  notifications: [
    { id: 'nf1', icon: 'message', title: 'Antonella sent 2 messages', sub: '“leave the lamp on for me?” · 12 min', color: '#d895a6', time: '12 min ago' }, 
    { id: 'nf2', icon: 'instagram', title: '3 new quiet likes', sub: 'on your post · 2 hours ago', color: '#bb91a7', time: '2h ago' }, 
    { id: 'nf3', icon: 'calendar', title: 'rehearsal starts tomorrow', sub: '10:00 — 18:00 · dance studio', color: '#9fba9f', time: '4h ago' }, 
    { id: 'nf4', icon: 'notebook', title: 'diary draft saved', sub: 'The hour after rain · today', color: '#ddb08b', time: '6h ago' }, 
    { id: 'nf5', icon: 'music', title: 'memory 14 played', sub: 'Pink + White · 1 hour ago', color: '#9b88ad', time: '1h ago' }
  ] as AppNotification[],
  files: [
    { id: 'f1', name: 'cover-study-03.psd', folder: 'Artwork', type: 'image', date: 'today' },
    { id: 'f2', name: 'voice-note-bridge.m4a', folder: 'Music Ideas', type: 'audio', date: 'yesterday' },
    { id: 'f3', name: 'moodboard-after-rain.pdf', folder: 'Design References', type: 'document', date: '24 May' }
  ] as FileItem[],
  calls: [
    { id: 'call1', contactId: 'c1', name: 'Antonella', time: 'yesterday', duration: '1:12:04', type: 'audio' },
    { id: 'call2', contactId: 'c2', name: 'Mar Rivera', time: 'Monday', missed: true, type: 'audio' },
    { id: 'call3', number: '+82 10-0000-0000', name: 'Unknown', time: '21 May', type: 'voicemail', duration: '0:14' }
  ] as CallRecord[],
  browserTabs: [
    { id: 't1', url: 'https://archive.org/details/film-stills', title: 'Vintage Film Scans - Internet Archive', active: true },
    { id: 't2', url: 'https://weather.com/ko-KR/weather/today/l/Seoul', title: 'Seoul, South Korea Weather' }
  ] as BrowserTab[],
  browserHistory: [
    { id: 'h1', url: 'https://en.wikipedia.org/wiki/Cyanotype', title: 'Cyanotype - Wikipedia', time: '2 hours ago' },
    { id: 'h2', url: 'https://vsco.co/', title: 'VSCO', time: 'yesterday' }
  ] as BrowserHistory[],
  browserBookmarks: [
    { id: 'b1', url: 'https://pinterest.com', title: 'Pinterest - Inspiration' },
    { id: 'b2', url: 'https://are.na', title: 'Are.na' }
  ] as BrowserBookmark[],
  echoPosts: [
    { id: 'ep1', author: 'hyune', handle: '@hyune', content: 'the light hitting the building across the street right now.', time: '2h', likes: 110, reposts: 12, replies: 4 },
    { id: 'ep2', author: 'hyune', handle: '@hyune', content: 'everything feels a little too loud today.', time: 'yesterday', likes: 450, reposts: 43, replies: 12 },
    { id: 'ep3', author: 'Antonella', handle: '@antocastillo', content: 'waking up to rain.', time: '4h', likes: 89, reposts: 3, replies: 1, isReposted: true }
  ] as EchoPost[],
  echoNotifications: [
    { id: 'en1', type: 'like', user: '@mira', text: 'liked your post.', time: '2h' },
    { id: 'en2', type: 'reply', user: '@antocastillo', text: 'it is very loud here too.', time: 'yesterday' }
  ] as EchoNotification[],
  studioProjects: [
    { id: 'sp1', title: 'after rain (demo 4)', status: 'demo', updated: 'Today, 14:20', metadata: '120 BPM · B minor · piano, strings', duration: '2:14', hasAudio: false },
    { id: 'sp2', title: 'untitled loop', status: 'idea', updated: '24 May', metadata: 'synth pad, reverb', duration: '0:45', hasAudio: false },
    { id: 'sp3', title: 'memory 14', status: 'finished', updated: 'April 2024', metadata: 'mastered · 44.1kHz 24bit', duration: '3:04', hasAudio: true }
  ] as StudioProject[],
  places: [
    { id: 'pl1', name: 'Hyune Studio', category: 'important locations', location: 'Hannam, Seoul', saved: true, notes: 'The lights are best at 4pm.' },
    { id: 'pl2', name: 'Little Cinema', category: 'art', location: 'Euljiro, Seoul', saved: true, notes: 'Back row seats.' },
    { id: 'pl3', name: 'Cafe by the river', category: 'cafés', location: 'Mangwon, Seoul', saved: false }
  ] as Place[],
  instagramStories: [] as InstagramStory[],
  echoDrafts: [] as EchoPost[],
  browserSearches: [] as BrowserHistory[],
  musicActivity: [] as MusicActivity[],
  publishedProposalIds: [] as string[],
  canon: seedCanon
};

export type PhoneStore = typeof seedPhone;
