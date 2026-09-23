import type { ActivityProposal } from '@workspace/api-client-react';
import type { PhoneStore } from './config';
import { createContact } from './createContact';

export type ReviewProposal = ActivityProposal & { reviewId: string };

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const meta = (proposal: ReviewProposal, key: string): string => text(proposal.metadata?.[key]);
const subtype = (proposal: ReviewProposal) => proposal.type.toLowerCase().replace(/[\s_-]+/g, ' ');
const isRetiredStoryAccount = (name: string) => /^(mar|mira|antonella)(?:\s|$)/i.test(name.trim());

function resolveStoryAccount(store: PhoneStore, person: string): { user: string; contactId?: string } {
  const account = person.trim();
  const normalized = account.toLowerCase();
  if (isRetiredStoryAccount(account)) {
    throw new Error(`Cannot publish Story: "${account}" is a retired Story account.`);
  }
  const profile = store.instagramProfile;
  if (!account ||
      account.toLowerCase() === (profile?.username || 'hyune.studio').toLowerCase() ||
      account.toLowerCase() === (profile?.displayName || 'Hyunjin').toLowerCase() ||
      account.toLowerCase() === 'hyunjin') {
    return { user: profile?.username || 'hyune.studio' };
  }
  const contact = store.contacts.find(candidate =>
    candidate.id.toLowerCase() === normalized ||
    candidate.name.toLowerCase() === normalized,
  );
  if (!contact) {
    throw new Error(`Cannot publish Story: "${account}" is not an existing Contact.`);
  }
  return { user: contact.name, contactId: contact.id };
}

export function publishActivity(store: PhoneStore, proposals: ReviewProposal[]): PhoneStore {
  let next: PhoneStore = structuredClone(store);
  const recorded = new Set(next.publishedProposalIds);

  for (const p of proposals) {
    if (recorded.has(p.reviewId)) continue;
    if (!p.reviewId || !text(p.title) || (!text(p.content) && !(p.app === 'instagram' && subtype(p).includes('story')))) {
      throw new Error('A reviewed item needs a title and content, except an image-prompt-only Instagram Story.');
    }
    const id = `ai-${crypto.randomUUID()}`;
    const title = text(p.title);
    const content = text(p.content);
    const time = text(p.timestamp) || new Date().toISOString();
    const person = text(p.person);
    const type = subtype(p);
    // Older generated batches could label contact cards with a supported non-contact app
    // because the API contract did not include Contacts. Respect their reviewed subtype.
    const destination = /^(new )?contact( card)?$/.test(type) ? 'contacts' : p.app;
    switch (destination) {
      case 'contacts':
        next = createContact(next, {
          name: meta(p, 'name') || person || title,
          role: meta(p, 'role') || type,
          context: meta(p, 'context') || content,
          color: meta(p, 'color') || undefined,
        });
        break;
      case 'diary':
        next.diary.unshift({ id, title, body: content, date: time, mood: meta(p, 'mood') || 'reflective' });
        break;
      case 'quickNotes':
        next.quickNotes.unshift({ id, text: content, time, color: '#d895a6' });
        break;
      case 'notes':
        next.notes.unshift({ id, title, body: content, meta: `ai-generated · ${time}`, color: '#d79bb0' });
        break;
      case 'messages': {
        if (!person) throw new Error('A message needs a contact.');
        const contact = next.contacts.find(c => c.name.toLowerCase() === person.toLowerCase());
        const thread = next.messages.find(m =>
          m.person.toLowerCase() === person.toLowerCase() ||
          (contact && m.person.toLowerCase().startsWith(contact.name.split(' ')[0].toLowerCase()))
        );
        const from = meta(p, 'from') === 'me' ? 'me' : 'them';
        if (thread) {
          thread.messages.push({ from, text: content, time });
          thread.preview = content;
          thread.time = time;
          next.messages = [thread, ...next.messages.filter(m => m !== thread)];
        } else {
          next.messages.unshift({
            id, person: contact?.name || person,
            initials: contact?.initials || person.slice(0, 2).toUpperCase(),
            preview: content, time, color: contact?.color || '#b4a0b8',
            messages: [{ from, text: content, time }],
          });
        }
        break;
      }
      case 'instagram':
        // Proposals describe a story; image generation is a separate user choice.
        // Never turn an image prompt into a caption or silently create a contact.
        if (type.includes('story')) {
          const account = resolveStoryAccount(next, person);
          const parsedDate = Date.parse(time);
          const storyDate = meta(p, 'date') || (Number.isFinite(parsedDate) ? new Date(parsedDate).toISOString().slice(0, 10) : undefined);
          const storyTime = meta(p, 'time') || time.match(/(?:T|[ ,])(\d{1,2}:\d{2})/)?.[1] || time;
          const story = {
            id, user: account.user, contactId: account.contactId, caption: content, time: storyTime,
            date: storyDate,
            createdAt: meta(p, 'createdAt') || new Date().toISOString(),
            expiresAt: meta(p, 'expiresAt') || undefined,
            viewed: meta(p, 'viewed') === 'true',
            imageId: meta(p, 'imageId') || undefined, dataUrl: meta(p, 'dataUrl') || undefined,
            imagePrompt: meta(p, 'imagePrompt') || undefined,
            audience: meta(p, 'audience') === 'close-friends' ? 'close-friends' : 'public',
            location: meta(p, 'location') || meta(p, 'context') || undefined,
            taggedContactIds: Array.isArray(p.metadata?.taggedContactIds)
              ? p.metadata.taggedContactIds.filter((value): value is string => typeof value === 'string' && next.contacts.some(c => c.id === value))
              : [],
            source: 'ai-generated',
          } as any;
          next.instagramStories.unshift(story);
        } else {
          next.posts.unshift({
            id, user: person || next.instagramProfile?.username || 'hyune.studio', caption: content, time, tone: 'rose', likes: 0,
            imageId: meta(p, 'imageId') || undefined, dataUrl: meta(p, 'dataUrl') || undefined,
            location: meta(p, 'location') || undefined,
            audience: meta(p, 'audience') === 'close-friends' ? 'close-friends' : 'public',
          });
        }
        break;
      case 'echo': {
        const post = { id, author: person || 'hyune', handle: person ? `@${person.toLowerCase().replace(/\s+/g, '')}` : '@hyune', content, time, likes: 0, reposts: 0, replies: 0 };
        if (type.includes('draft')) next.echoDrafts.unshift(post);
        else next.echoPosts.unshift(post);
        break;
      }
      case 'gallery':
        next.gallery.unshift({ id, title, caption: content, date: time, album: meta(p, 'album') || 'Random Photos', tone: 'rose', imageId: meta(p, 'imageId') || undefined, dataUrl: meta(p, 'dataUrl') || undefined });
        break;
      case 'browser': {
        const history = { id, title, url: meta(p, 'url') || content, time };
        if (type.includes('search')) next.browserSearches.unshift(history);
        else next.browserHistory.unshift(history);
        break;
      }
      case 'calls': {
        const contact = next.contacts.find(c => c.name.toLowerCase() === person.toLowerCase());
        const missed = type.includes('missed') || meta(p, 'missed') === 'true';
        const call = { id, contactId: contact?.id, name: contact?.name || person || title, time, missed, duration: meta(p, 'duration') || undefined, type: type.includes('voicemail') ? 'voicemail' as const : type.includes('video') ? 'video' as const : 'audio' as const };
        next.calls.unshift(call);
        if (missed) next.notifications.unshift({ id: `${id}-notification`, icon: 'phone', title: `Missed call from ${call.name}`, sub: content, color: '#d895a6', time });
        break;
      }
      case 'voice':
        next.voice.unshift({
          id, title, transcript: content, date: time, duration: '—', private: meta(p, 'private') !== 'false',
          context: meta(p, 'context'), delivery: meta(p, 'delivery'), category: meta(p, 'category'),
          relatedEvent: meta(p, 'relatedEvent'),
          language: (['English', 'Korean', 'Mixed'].includes(meta(p, 'language')) ? meta(p, 'language') : 'English') as 'English' | 'Korean' | 'Mixed',
        });
        break;
      case 'music':
        if (type.includes('original track')) {
          const requestedType = meta(p, 'trackType');
          const trackType = (['Full Song', 'Demo', 'Instrumental', 'Loop / Idea'].includes(requestedType) ? requestedType : 'Demo') as 'Full Song' | 'Demo' | 'Instrumental' | 'Loop / Idea';
          next.originalTracks = [{
            id, title, date: time, type: trackType, status: 'Idea',
            genre: meta(p, 'genre'), mood: meta(p, 'mood'), prompt: meta(p, 'prompt') || content,
            lyrics: meta(p, 'lyrics'), mode: trackType === 'Instrumental' ? 'instrumental' : trackType === 'Loop / Idea' ? 'loop' : trackType === 'Full Song' ? 'vocals' : 'demo',
            notes: content, favorite: false, relatedStoryUpdate: meta(p, 'relatedStoryUpdate') || undefined,
            source: 'Story Update', createdAt: new Date().toISOString(),
          }, ...(next.originalTracks || [])];
        } else {
          next.musicActivity.unshift({ id, title, content, time, source: 'ai-generated' });
        }
        break;
      case 'studio':
        next.studioProjects.unshift({ id, title, metadata: content, updated: time, status: type.includes('demo') ? 'demo' : 'idea', hasAudio: false });
        break;
      case 'calendar': {
        const day = Number(meta(p, 'day')) || Number(time.match(/\b(?:0?[1-9]|[12]\d|3[01])\b/)?.[0]) || new Date().getDate();
        next.events.unshift({ id, day: Math.min(31, Math.max(1, day)), title, time, kind: meta(p, 'kind') || 'story' });
        break;
      }
      case 'places':
        next.places.unshift({ id, name: title, location: meta(p, 'location') || content, category: meta(p, 'category') || 'important locations', notes: content, saved: true });
        break;
      case 'files':
        next.files.unshift({ id, name: title, folder: meta(p, 'folder') || 'RP Materials', type: meta(p, 'fileType') || 'document', date: time });
        break;
      case 'notifications':
        next.notifications.unshift({ id, title, sub: content, icon: meta(p, 'icon') || 'story', color: '#d895a6', time });
        break;
      default:
        throw new Error(`Unsupported activity destination: ${destination}`);
    }
    recorded.add(p.reviewId);
  }
  next.publishedProposalIds = [...recorded];
  return next;
}