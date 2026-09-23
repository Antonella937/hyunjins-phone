import type { InstagramStory, PhoneStore } from './config';

export type StoryAccount = {
  key: string;
  name: string;
  initials: string;
  color: string;
  avatarUrl?: string;
};

const retiredName = (name: string) => /^(mar|mira|antonella)(?:\s|$)/i.test(name.trim());

export function isRetiredStoryContact(name: string): boolean {
  return retiredName(name);
}

export function storyImageUrl(story: InstagramStory): string | undefined {
  return story.imageId ? `/api/story/image/${story.imageId}` : story.dataUrl;
}

export function storyAccount(story: InstagramStory, store: PhoneStore): StoryAccount {
  if (story.contactId) {
    const contact = store.contacts.find(c => c.id === story.contactId);
    if (contact) return {
      key: `contact:${contact.id}`,
      name: contact.name,
      initials: contact.initials || contact.name.slice(0, 2).toUpperCase(),
      color: contact.color,
      avatarUrl: contact.photoDataUrl,
    };
  }
  const profile = store.instagramProfile;
  const username = profile?.username || 'hyune.studio';
  if (!story.contactId && ['you', 'hyunjin', 'hyune.studio', username.toLowerCase()].includes(story.user.toLowerCase())) {
    return {
      key: 'self',
      name: username,
      initials: (profile?.displayName || 'Hyunjin').slice(0, 1).toUpperCase(),
      color: '#d98ca7',
      avatarUrl: profile?.imageId ? `/api/story/image/${profile.imageId}` : profile?.photoDataUrl,
    };
  }
  return {
    key: `legacy:${story.contactId || story.user.toLowerCase()}`,
    name: story.user,
    initials: story.user.slice(0, 2).toUpperCase(),
    color: '#d98ca7',
  };
}

export function isStoryActive(story: InstagramStory, store: PhoneStore): boolean {
  if (!storyImageUrl(story)) return false;
  if (story.contactId && !store.contacts.some(c => c.id === story.contactId)) return false;
  if (retiredName(storyAccount(story, store).name)) return false;
  if (story.expiresAt) {
    const expiration = Date.parse(story.expiresAt);
    if (Number.isFinite(expiration) && expiration <= Date.now()) return false;
  }
  return true;
}

export function activeStoryGroups(store: PhoneStore): { account: StoryAccount; stories: InstagramStory[] }[] {
  const groups = new Map<string, { account: StoryAccount; stories: InstagramStory[] }>();
  for (const story of store.instagramStories) {
    if (!isStoryActive(story, store)) continue;
    const account = storyAccount(story, store);
    const group = groups.get(account.key);
    if (group) group.stories.push(story);
    else groups.set(account.key, { account, stories: [story] });
  }
  return Array.from(groups.values()).map(group => ({
    ...group,
    stories: group.stories.sort((a, b) => {
      const aDate = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bDate = b.createdAt ? Date.parse(b.createdAt) : 0;
      return (Number.isFinite(aDate) ? aDate : 0) - (Number.isFinite(bDate) ? bDate : 0);
    }),
  }));
}