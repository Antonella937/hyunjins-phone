import type { ActivityProposal } from '@workspace/api-client-react';
import type { PhoneStore } from './config';
import { createContact } from './createContact';

export type ReviewProposal = ActivityProposal & { reviewId: string };

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';
const meta = (proposal: ReviewProposal, key: string): string => text(proposal.metadata?.[key]);
const subtype = (proposal: ReviewProposal) => proposal.type.toLowerCase().replace(/[\s_-]+/g, ' ');
const isRetiredStoryAccount = (name: string) => /^(mar|mira|antonella)(?:\s|$)/i.test(name.trim());

function echoActor(store: PhoneStore, person: string) {
  const name = person.trim();
  if (!name || /^(hyune|hyunjin|@hyune)$/i.test(name)) {
    return { author: store.echoProfile?.displayName || 'hyune', handle: store.echoProfile?.username || '@hyune', contactId: undefined };
  }
  const contact = store.contacts.find(candidate =>
    candidate.id.toLowerCase() === name.toLowerCase() ||
    candidate.name.toLowerCase() === name.toLowerCase() ||
    (name.toLowerCase() === 'nela' && candidate.id === 'c1' && candidate.name.toLowerCase() === 'antonella')
  );
  if (!contact) throw new Error(`Cannot publish Echo: "${name}" is not an existing Contact.`);
  const display = contact.id === 'c1' && contact.name.toLowerCase() === 'antonella' ? 'Nela' : contact.name;
  const handle = store.echoAccountHandles?.[contact.id] || `@${display.toLowerCase().replace(/[^a-z0-9_]/g, '')}`;
  return { author: display, handle, contactId: contact.id };
}

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
        const actor = echoActor(next, person);
        const targetId = meta(p, 'targetPostId');
        const target = targetId ? next.echoPosts.find(item => item.id === targetId) : undefined;
        const needsTarget = ['like', 'save', 'repost', 'reply'].some(action => type.includes(action));
        if (needsTarget && !target) throw new Error(`Cannot publish Echo ${type}: choose an existing targetPostId.`);
        const isSelf = !actor.contactId;
         const targetIsSelf = target && !target.contactId && ['hyune', next.echoProfile?.displayName, next.echoProfile?.username?.replace(/^@/, '')].includes(target.author);
        if (type.includes('like')) {
          if (isSelf) {
            if (!target!.likedByHyunjin && !target!.isLiked) { target!.likedByHyunjin = true; target!.likes += 1; }
          } else {
            target!.likes += 1;
             if (targetIsSelf) next.echoNotifications.unshift({ id, type: 'like', user: actor.handle, contactId: actor.contactId, postId: targetId, text: 'liked your Echo.', time });
          }
        } else if (type.includes('save')) {
          if (!isSelf) throw new Error('Only Hyunjin can save an Echo.');
          target!.saved = true;
        } else if (type.includes('repost')) {
          if (isSelf) {
             if (!target!.repostedByHyunjin && !target!.isReposted) {
               target!.repostedByHyunjin = true;
               target!.reposts += 1;
               next.echoPosts.unshift({
                 id, author: next.echoProfile?.username.replace(/^@/, '') || 'hyune',
                 handle: next.echoProfile?.username || '@hyune', content: '', time,
                 likes: 0, reposts: 0, replies: 0, isRepost: true,
                 quotedPostId: targetId, createdAt: new Date().toISOString(), source: 'story-update',
               });
             }
          } else {
            target!.reposts += 1;
             if (targetIsSelf) next.echoNotifications.unshift({ id, type: 'repost', user: actor.handle, contactId: actor.contactId, postId: targetId, text: 'reposted your Echo.', time });
          }
        } else {
          const post = { id, ...actor, content, time, createdAt: new Date().toISOString(), likes: 0, reposts: 0, replies: 0, source: 'story-update' as const,
            imageId: meta(p, 'imageId') || undefined, galleryId: meta(p, 'galleryId') || undefined,
            location: meta(p, 'location') || undefined, replyToId: type.includes('reply') ? targetId : undefined };
          if (type.includes('draft')) {
            if (!isSelf) throw new Error('Only Hyunjin can save an Echo draft.');
            next.echoDrafts.unshift(post);
          } else {
            next.echoPosts.unshift(post);
            if (post.replyToId) {
              target!.replies += 1;
               if (!isSelf && targetIsSelf) next.echoNotifications.unshift({ id: `${id}-notification`, type: 'reply', user: actor.handle, contactId: actor.contactId, postId: targetId, text: 'replied to your Echo.', time });
            }
          }
        }
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