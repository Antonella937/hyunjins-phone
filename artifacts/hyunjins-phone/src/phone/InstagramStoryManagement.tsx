import React from 'react';
import { ArrowLeft, Edit3, Image as ImageIcon, Plus, Trash2 } from 'lucide-react';
import type { PhoneStore, InstagramStory } from './config';
import { isStoryActive, storyAccount, storyImageUrl } from './InstagramStoryUtils';

type Props = {
  store: PhoneStore;
  onClose: () => void;
  onEdit: (id: string) => void;
  onNew: () => void;
  commit: (update: (s: PhoneStore) => PhoneStore) => void;
};

function StoryThumbnail({ story, store }: { story: InstagramStory; store: PhoneStore }) {
  const imageUrl = storyImageUrl(story);
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />;
  }

  return (
    <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-xl border border-dashed border-white/20 bg-white/[.04] text-white/40">
      <ImageIcon size={17} />
      <span className="mt-1 text-[9px]">No image</span>
    </div>
  );
}

export function InstagramStoryManagement({ store, onClose, onEdit, onNew, commit }: Props) {
  const stories = store.instagramStories || [];

  const deleteStory = (story: InstagramStory) => {
    if (!window.confirm(`Delete ${storyAccount(story, store).name}'s Story?`)) return;
    commit((current) => ({
      ...current,
      instagramStories: current.instagramStories.filter((item) => item.id !== story.id),
      instagramHighlights: current.instagramHighlights?.map((highlight) => ({
        ...highlight,
        storyIds: highlight.storyIds.filter((id) => id !== story.id),
      })),
    }));
  };

  return (
    <div className="flex h-full flex-col bg-[#251e2b] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <button onClick={onClose} className="text-white/55 transition-colors hover:text-white" aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-medium">Stories</h2>
          <p className="mt-0.5 text-[10px] uppercase tracking-[.2em] text-white/40">Manage Instagram</p>
        </div>
        <button onClick={onNew} className="flex items-center gap-1 text-xs text-[#e7aabb] transition-colors hover:text-white" data-testid="button-story-management-new">
          <Plus size={16} /> New Story
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {stories.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <ImageIcon size={28} className="mb-3 text-white/25" />
            <p className="text-sm text-white/55">No Stories yet.</p>
            <button onClick={onNew} className="mt-4 rounded-xl bg-[#d98ca7] px-4 py-2 text-xs font-medium text-[#251e2b]">Create New Story</button>
          </div>
        ) : (
          <div className="space-y-2">
            {stories.map((story) => {
              const account = storyAccount(story, store);
              const active = isStoryActive(story, store);
              return (
                <div key={story.id} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3" data-testid={`story-management-item-${story.id}`}>
                  <StoryThumbnail story={story} store={store} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {account.avatarUrl ? (
                        <img src={account.avatarUrl} alt="" className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-semibold text-[#251e2b]" style={{ background: account.color }}>
                          {account.initials}
                        </span>
                      )}
                      <p className="truncate text-sm">{account.name}</p>
                    </div>
                    <p className="mt-1 truncate text-[11px] text-white/45">{story.date ? `${story.date} · ` : ''}{story.time || 'No time'}{story.location ? ` · ${story.location}` : ''}</p>
                    <span className={`mt-1 inline-block text-[10px] ${active ? 'text-[#e7aabb]' : 'text-white/35'}`}>{active ? 'Active' : storyImageUrl(story) ? 'Expired' : 'Needs image'}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!storyImageUrl(story) && <button onClick={() => onEdit(story.id)} className="max-w-14 text-[10px] text-[#e7aabb]">Generate Image</button>}
                    <button onClick={() => onEdit(story.id)} className="rounded-lg p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white" aria-label={`Edit ${account.name}'s Story`} data-testid={`button-story-management-edit-${story.id}`}>
                      <Edit3 size={15} />
                    </button>
                    <button onClick={() => deleteStory(story)} className="rounded-lg p-2 text-white/45 transition-colors hover:bg-red-500/10 hover:text-red-300" aria-label={`Delete ${account.name}'s Story`} data-testid={`button-story-management-delete-${story.id}`}>
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}