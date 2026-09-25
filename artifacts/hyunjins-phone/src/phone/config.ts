export const characterProfile = {
  name: 'Hyunjin',
  handle: '@hyune.studio',
  city: 'Seoul, KR',
  accent: '#d98ca7',
  accentSoft: '#f3c4c7',
  wallpaper: 'aurora',
  tagline: 'small evidence of a life in motion',
};

export type PhoneMessage = { id: string; person: string; initials: string; preview: string; time: string; unread?: number; pinned?: boolean; color: string; messages: { from: 'me' | 'them'; text: string; time: string; kind?: 'photo' | 'voice' | 'music'; audioTrackId?: string }[] };
export type DiaryEntry = { id: string; date: string; title: string; mood: string; body: string; audioTrackId?: string };
export type QuickNote = { id: string; text: string; time: string; color: string };
export type CalendarEvent = { id: string; day: number; title: string; time: string; kind: string };
export type Contact = {
  id: string; name: string; initials: string; role: string; context: string; color: string;
  firstName?: string; lastName?: string; nickname?: string; relationship?: string;
  notes?: string; favorite?: boolean; photoDataUrl?: string;
};
export type GalleryItem = { id: string; title: string; album: string; date: string; caption: string; tone: string; favorite?: boolean; dataUrl?: string; imageId?: string };
export type InstagramComment = { id: string; user: string; text: string; time: string };
export type Post = {
  id: string; user: string; caption: string; time: string; tone: string; likes: number;
  saved?: boolean; liked?: boolean; dataUrl?: string; imageId?: string;
  location?: string; comments?: InstagramComment[]; taggedContactIds?: string[];
  audience?: 'public' | 'close-friends';
};
export type VoiceMemo = {
  id: string; title: string; date: string; duration: string; transcript: string; private?: boolean;
  context?: string; delivery?: string; category?: string; relatedEvent?: string; relatedContactId?: string;
  language?: 'English' | 'Korean' | 'Mixed'; voiceId?: 'alloy' | 'echo' | 'onyx';
  audioId?: string; durationSeconds?: number;
};
export type Note = { id: string; title: string; meta: string; color: string; body: string };
export type AppNotification = { id: string; icon: string; title: string; sub: string; color: string; time: string };
export type FileItem = { id: string; name: string; folder: string; type: string; date: string; audioTrackId?: string };
export type CallRecord = { id: string; contactId?: string; number?: string; name?: string; time: string; duration?: string; missed?: boolean; type: 'audio' | 'video' | 'voicemail' };
export type BrowserTab = { id: string; url: string; title: string; active?: boolean; private?: boolean };
export type BrowserHistory = { id: string; url: string; title: string; time: string };
export type BrowserBookmark = { id: string; url: string; title: string };
export type EchoPost = {
  id: string; author: string; handle: string; content: string; time: string;
  likes: number; reposts: number; replies: number;
  contactId?: string; createdAt?: string; likedByHyunjin?: boolean; repostedByHyunjin?: boolean; saved?: boolean;
  imageId?: string; dataUrl?: string; galleryId?: string; location?: string;
  quotedPostId?: string; replyToId?: string; source?: 'manual' | 'ai-generated' | 'story-update' | 'seed';
  isRepost?: boolean; isLiked?: boolean; isReposted?: boolean;
};
export type EchoNotification = { id: string; type: 'like' | 'repost' | 'reply' | 'mention'; user: string; text: string; time: string; contactId?: string; postId?: string };
export type EchoProfile = { displayName: string; username: string; bio: string };
export type StudioProject = { id: string; title: string; status: 'demo' | 'unfinished' | 'finished' | 'idea'; updated: string; metadata: string; duration?: string; hasAudio?: boolean };
export type Place = { id: string; name: string; category: string; location: string; notes?: string; saved?: boolean };
export type InstagramStory = {
  id: string; user: string; caption: string; time: string; dataUrl?: string; imageId?: string;
  contactId?: string; date?: string; createdAt?: string; expiresAt?: string; viewed?: boolean;
  source?: 'ai-generated' | 'gallery' | 'upload' | 'manual'; imagePrompt?: string; location?: string;
  audience?: 'public' | 'close-friends'; taggedContactIds?: string[]; audioTrackId?: string;
};
export type InstagramProfile = { displayName: string; username: string; bio: string; location: string; photoDataUrl?: string; imageId?: string };
export type InstagramHighlight = { id: string; name: string; storyIds: string[] };
export type MusicActivity = { id: string; title: string; content: string; time: string; source?: 'ai-generated' };
export type SpotifyTrackRef = { id: string; uri: string; name: string; artists: string[]; album: string; artwork: string | null; durationMs: number; externalUrl: string };
export type MusicPlaylist = { id: string; name: string; songs: string[]; description?: string; artwork?: string; spotifyTracks?: SpotifyTrackRef[] };
export type OriginalTrack = {
  id: string; title: string; coverImageId?: string; audioId?: string; durationSeconds?: number;
  date: string; type: 'Full Song' | 'Demo' | 'Instrumental' | 'Loop / Idea';
  status: 'Idea' | 'Work in Progress' | 'Demo' | 'Finished';
  genre: string; mood: string; prompt: string; lyrics: string;
  mode: 'instrumental' | 'vocals' | 'demo' | 'loop';
  notes: string; favorite: boolean; relatedStoryUpdate?: string;
  source: 'AI Generated' | 'Story Update' | 'Manual Idea'; createdAt: string;
};

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
  export const seedCanon: Canon = {
  character: "Hyunjin. Korean artist and public figure based in Seoul. He is a member of Stray Kids, and his public life includes music, performance, dance, schedules, travel and the visibility that comes with being a celebrity. Privately, he is observant, expressive and creatively intense. He can be playful and teasing with people he trusts, but quieter and introspective when processing something. Dance is one of his main forms of expression. He draws, paints, photographs and cares deeply about fashion, visual art and design. He notices light, texture, movement, color and small visual details. He needs quiet as much as stimulation and often turns ordinary moments into creative material.",

  currentLocation: "Hyunjin is currently in Seoul, South Korea. Nela lives in Buenos Aires, Argentina. Their relationship exists across the Seoul–Buenos Aires distance and time difference. Hyunjin's public and professional life remains centered around Seoul, Stray Kids and his existing schedules.",

  relationships: "Nela (Antonella) is Hyunjin's girlfriend and a private part of his life. Their relationship is affectionate, playful, creatively intimate and long-distance. They share ordinary moments through messages, photographs, sketches, voice notes, calls, teasing and quiet conversations. Privacy is essential: the Stray Kids members do not currently know about Nela or the relationship, and Nela's friends do not currently know about Hyunjin or the relationship either. Never casually reveal, imply or expose the relationship to either social circle unless a future Story Update explicitly changes this.",

  friends: "Hyunjin's established social and professional world includes the other Stray Kids members: Bang Chan, Lee Know, Changbin, Han, Felix, Seungmin and I.N. They are part of his real everyday life, work and schedules, but they currently know nothing about Nela or his private relationship with her. Do not invent replacement best friends, managers, photographers or creative directors merely to populate the phone. New recurring people should only become canon when explicitly introduced.",

  contacts: "Nela (Antonella) is a private online contact and girlfriend. Hyunjin's existing personal and professional world can include Bang Chan, Lee Know, Changbin, Han, Felix, Seungmin, I.N and family. A person should only become an active phone or social-media contact when they actually exist in the phone Contacts or are explicitly introduced by a Story Update. Do not invent contacts simply to create activity.",

  importantMemories: "Hyunjin first noticed Nela online after she posted one of her sketches on Instagram. He left a comment about the artwork. That small interaction led to private messages, and they gradually began talking regularly. Their connection developed through art, curiosity, humor, increasingly personal conversations and the unusual intimacy of getting to know each other from opposite sides of the world. Over time the relationship became romantic and they eventually became boyfriend and girlfriend. A recurring private image between them is an empty sunlit place on Hyunjin's sofa in Seoul: a spot he described as reserved for Nela. Nela has promised that one day she will show up, and they agreed that the first thing when she does will be a hug. Nela's cats Miguel, Gaia and Kira have become part of their private jokes, with Hyunjin treating them as the household executive board he will eventually have to win over.",

  recentEvents: "Late September 2026. Hyunjin and Nela are continuing their private long-distance relationship between Seoul and Buenos Aires. Recent conversations have revolved around missing each other, ordinary home life, art, photographs, quiet days and the idea of Nela eventually being physically present in the empty place on his sofa. Nela recently sent a photograph of herself at home with Miguel, Gaia and Kira. Hyunjin joked about having to face their tribunal and told her that the picture felt like home. Their relationship remains unknown to the people around both of them.",

  currentProjects: "Hyunjin's ongoing creative life includes drawing, painting, photography, dance, performance, fashion, design and music. Creative projects should emerge from established canon or Story Updates rather than the AI inventing major commissions, releases or career developments. Small sketches, studies, unfinished ideas, photographs, melodies and visual experiments may appear naturally and can recur or evolve across multiple days. His professional work with Stray Kids continues independently of his relationship with Nela.",

  preferences: "Hyunjin is drawn to drawing, painting, photography, dance, fashion, design, museums, galleries, cinema, night walks, cafes and visually interesting everyday spaces. He likes expressive clothing and silver jewelry and pays attention to shadows, changing light, texture, composition and movement. He enjoys quiet domestic time and can spend a day drawing, thinking or doing very little without considering it wasted. With Nela, communication can naturally include texts, photographs, sketches, voice notes and calls. His creative interests should feel varied and lived-in rather than reduced to one recurring aesthetic.",

  recurringPlaces: "Hyunjin's apartment in Seoul, especially the sofa and changing window light; Stray Kids practice and rehearsal spaces; recording and performance environments; creative studios; cafes; museums and galleries; bookstores; convenience stores; and streets explored during walks around Seoul. Specific businesses or locations should only become recurring places when established by canon or a Story Update.",

  importantDates: "September 2026 — current relationship era. Exact relationship milestones should only be assigned specific calendar dates when they have been explicitly established in canon. Preserve future dates and milestones introduced through Story Updates rather than inventing them.",

  ongoingStorylines: "Hyunjin and Nela are learning the rhythm of a private long-distance relationship between Seoul and Buenos Aires. They are emotionally close while still maintaining separate everyday lives. Neither Hyunjin's Stray Kids members nor Nela's friends currently know about the relationship, creating a quiet boundary between their private connection and their visible lives. Nela eventually visiting Seoul and occupying the reserved place on Hyunjin's sofa is a meaningful future possibility, not an event that has already happened. Hyunjin should maintain a full independent life involving Stray Kids, dance, art, work, friends, family, routines and private creative habits instead of existing only in relation to Nela. Small creative ideas and emotional threads may recur naturally over time.",

  relationshipHistory: "Hyunjin and Nela met online rather than through an in-person schedule. Hyunjin discovered a sketch Nela had posted on Instagram and left a comment about the artwork. The interaction moved into private messages and gradually became an ongoing conversation. Their connection grew through shared creative interests, humor, curiosity, personal conversations and the experience of becoming important to each other from Seoul and Buenos Aires. The relationship eventually became romantic and they are now boyfriend and girlfriend. They have not built a public couple identity: the relationship is currently private from Hyunjin's Stray Kids members and from Nela's own friends. Do not use the obsolete backstory in which they knew each other for four years, met during a South American schedule, or had already shared an established in-person life.",

  masterTimeline: "September 2026 is the current canon period. Earlier: Hyunjin encountered one of Nela's sketches on Instagram and commented on it; they began exchanging private messages and continued getting to know each other online across Seoul and Buenos Aires. Their connection gradually became romantic and they became boyfriend and girlfriend. Current: they are maintaining a private long-distance relationship while each continues an independent life. The Stray Kids members do not know about Nela or the relationship, and Nela's friends do not know about Hyunjin or the relationship. Future: meeting in person, Nela visiting Seoul, disclosure to friends or members, travel together and other major relationship developments must remain unresolved until explicitly introduced through canon or a Story Update."
};
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
  instagramProfile: { displayName: 'Hyunjin', username: 'hyune.studio', bio: '', location: 'Seoul' } as InstagramProfile,
  instagramHighlights: [
    { id: 'ig-close-friends', name: 'Close Friends', storyIds: [] },
    { id: 'ig-saved', name: 'saved', storyIds: [] },
    { id: 'ig-tagged', name: 'tagged', storyIds: [] },
    { id: 'ig-activity', name: 'activity', storyIds: [] },
  ] as InstagramHighlight[],
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
    { id: 'ep1', author: 'hyune', handle: '@hyune', content: 'the light hitting the building across the street right now.', time: '2h', likes: 110, reposts: 12, replies: 4, source: 'seed' },
    { id: 'ep2', author: 'hyune', handle: '@hyune', content: 'everything feels a little too loud today.', time: 'yesterday', likes: 450, reposts: 43, replies: 12, source: 'seed' },
    { id: 'ep3', author: 'Nela', contactId: 'c1', handle: '@nela', content: 'waking up to rain.', time: '4h', likes: 89, reposts: 3, replies: 1, isReposted: true, source: 'seed' }
  ] as EchoPost[],
  echoNotifications: [
    { id: 'en1', type: 'like', user: '@mira', text: 'liked your post.', time: '2h' },
    { id: 'en2', type: 'reply', user: '@nela', contactId: 'c1', text: 'it is very loud here too.', time: 'yesterday' }
  ] as EchoNotification[],
  echoAccountHandles: { c1: '@nela' } as Record<string, string>,
  echoProfile: { displayName: 'hyune', username: '@hyune', bio: 'small evidence of a life in motion.' } as EchoProfile,
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
  musicPlaylists: [
    { id: 'playlist-night-walks', name: 'night walks', songs: ['Pink + White', 'The Louvre', 'Garden Song', 'Mystery of Love', 'Nights'] },
    { id: 'playlist-for-antonella', name: 'for Antonella', songs: ['Pink + White', 'The Louvre', 'Garden Song', 'Mystery of Love', 'Nights'] },
    { id: 'playlist-studio-light', name: 'studio light', songs: ['Pink + White', 'The Louvre', 'Garden Song', 'Mystery of Love', 'Nights'] },
    { id: 'playlist-memory-14', name: 'memory 14', songs: ['Pink + White', 'The Louvre', 'Garden Song', 'Mystery of Love', 'Nights'] },
  ] as MusicPlaylist[],
  musicActivity: [] as MusicActivity[],
  originalTracks: [] as OriginalTrack[],
  publishedProposalIds: [] as string[],
  canon: seedCanon
};

export type PhoneStore = typeof seedPhone;
