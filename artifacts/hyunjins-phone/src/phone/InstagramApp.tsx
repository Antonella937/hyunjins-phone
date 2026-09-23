import React, { useState } from 'react';
import { ArrowLeft, Heart, Star, UserRound, Plus, Menu, Send, Trash2, Camera, Image as ImageIcon, Edit3, MessageCircle, Bookmark, Check, X } from 'lucide-react';
import type { PhoneStore, Post, InstagramStory, InstagramProfile, InstagramHighlight, InstagramComment } from './config';
import { ImagePicker } from './InstagramImagePicker';
import { StoryViewer } from './InstagramStoryViewer';
import { ProfileEditor, PostEditor, StoryEditor } from './InstagramEditors';
import { HighlightViewer } from './InstagramHighlightViewer';

type Detail = { kind: string; id: string } | null;

type Props = {
  store: PhoneStore;
  detail: Detail;
  setDetail: (d: Detail) => void;
  editMode: boolean;
  commit: (update: (s: PhoneStore) => PhoneStore) => void;
};

const defaultProfile: InstagramProfile = {
  displayName: 'Hyunjin',
  username: 'hyune.studio',
  bio: '',
  location: 'Seoul',
};

const defaultHighlights: InstagramHighlight[] = [
  { id: 'Close Friends', name: 'Close Friends', storyIds: [] },
  { id: 'saved', name: 'saved', storyIds: [] },
  { id: 'tagged', name: 'tagged', storyIds: [] },
  { id: 'activity', name: 'activity', storyIds: [] },
];

function Avatar({ initials, color, size = 'md', photoUrl }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg'; photoUrl?: string }) {
  const sizeClass = size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-16 w-16 text-lg' : 'h-11 w-11 text-xs';
  if (photoUrl) {
    return <img src={photoUrl} className={`inline-flex shrink-0 items-center justify-center rounded-full object-cover shadow-sm ${sizeClass}`} alt={initials} />;
  }
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-[#251e2b] ${sizeClass}`} style={{ background: `linear-gradient(145deg, ${color}, #f2d7bb)` }} data-testid={`avatar-${initials}`}>{initials}</span>;
}

function SectionTitle({ children, action, onAction }: { children: React.ReactNode; action?: string; onAction?: () => void }) {
  return <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] uppercase tracking-[.23em] text-white/45">{children}</h3>{action && <button onClick={onAction} className="text-xs text-[#e7aabb] hover:text-white" data-testid={`button-${action.toLowerCase().replaceAll(' ', '-')}`}>{action}</button>}</div>;
}

function ShareMenu({ store, onShare, onCancel }: { store: PhoneStore; onShare: (contactId: string) => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-[#251e2b] rounded-t-3xl p-4 min-h-[40vh]" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-white">Share</h4>
          <button onClick={onCancel} className="text-white/50"><X size={20} /></button>
        </div>
        <div className="grid grid-cols-4 gap-4 overflow-y-auto">
          {store.contacts.slice(0, 8).map(c => (
            <button key={c.id} onClick={() => { onShare(c.id); onCancel(); }} className="flex flex-col items-center gap-2">
              <Avatar initials={c.initials} color={c.color} size="md" photoUrl={c.photoDataUrl} />
              <span className="text-[10px] text-white/70 line-clamp-1">{c.name}</span>
            </button>
          ))}
        </div>
        <div className="mt-6 border-t border-white/10 pt-4 flex gap-4">
          <button onClick={() => { alert('Link copied to clipboard!'); onCancel(); }} className="flex items-center gap-2 text-xs text-white/70 bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10">Copy Link</button>
        </div>
      </div>
    </div>
  );
}

function PostCard({ post, store, onClick, large, onLike, onSave, onCommentClick, onEdit, editMode }: { post: Post; store: PhoneStore; onClick?: () => void; large?: boolean; onLike: () => void; onSave: () => void; onCommentClick: () => void; onEdit?: () => void; editMode: boolean; }) {
  const imageUrl = post.imageId ? `/api/story/image/${post.imageId}` : post.dataUrl;
  const [sharing, setSharing] = useState(false);

  // Derive initials from first two chars if not specific
  const authorInitials = post.user === 'mar.rivera' ? 'MR' : post.user.substring(0,2).toUpperCase();

  const handleShare = (contactId: string) => {
    alert(`Shared securely to ${store.contacts.find(c => c.id === contactId)?.name || 'contact'}`);
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.045]" data-testid={`card-post-${post.id}`}>
      <div className="flex items-center gap-2 px-4 py-3 cursor-pointer" onClick={onClick}>
        <Avatar initials={authorInitials} color={post.tone === 'rose' ? '#d895a6' : '#e4b878'} size="sm" />
        <div className="flex-1">
          <p className="text-xs">{post.user}</p>
          <p className="text-[10px] text-white/40">{post.time} {post.location ? `· ${post.location}` : '· Seoul'}</p>
        </div>
        {editMode && onEdit ? (
          <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-full p-1 text-white/45 hover:text-white" data-testid={`button-post-edit-${post.id}`}><Edit3 size={15} /></button>
        ) : (
          <button className="rounded-full p-1 text-white/45" data-testid={`button-post-more-${post.id}`} onClick={(e) => { e.stopPropagation(); onEdit?.(); }}><Menu size={15} /></button>
        )}
      </div>
      <button onClick={onClick} className={`relative block w-full overflow-hidden bg-gradient-to-br ${post.tone === 'blue' ? 'from-[#1d3548] via-[#7188a1] to-[#d7a78e]' : post.tone === 'rose' ? 'from-[#3b283d] via-[#ba8291] to-[#f2c6aa]' : 'from-[#3d3022] via-[#b99362] to-[#e9cda5]'} ${large ? 'h-80' : 'h-56'}`} data-testid={`button-open-post-${post.id}`}>
        {imageUrl ? (
          <img src={imageUrl} className="h-full w-full object-cover" />
        ) : (
          <>
            <span className="absolute -right-12 top-8 h-52 w-52 rounded-full border border-white/25" />
            <span className="absolute bottom-8 left-8 font-serif text-3xl italic text-white/80">
              {post.tone === 'blue' ? 'blue hour' : post.tone === 'rose' ? 'after rain' : 'studio / 04'}
            </span>
          </>
        )}
      </button>
      <div className="px-4 py-3">
        <div className="flex items-center gap-4">
          <button onClick={(e) => { e.stopPropagation(); onLike(); }} className={`text-white/70 hover:text-[#ecabb8] ${post.liked ? 'text-[#ecabb8]' : ''}`} data-testid={`button-like-post-${post.id}`}>
            <Heart size={17} fill={post.liked ? '#ecabb8' : 'none'} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onCommentClick(); }} className="text-white/70 hover:text-white" data-testid={`button-comment-post-${post.id}`}>
            <MessageCircle size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); setSharing(true); }} className="text-white/70 hover:text-white" data-testid={`button-share-post-${post.id}`}>
            <Send size={16} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onSave(); }} className={`ml-auto text-white/70 hover:text-[#e7b967] ${post.saved ? 'text-[#e7b967]' : ''}`} data-testid={`button-save-post-${post.id}`}>
            <Bookmark size={17} fill={post.saved ? '#e7b967' : 'none'} />
          </button>
        </div>
        <p className="mt-2 text-[11px] text-white/55">{post.likes.toLocaleString()} quiet likes</p>
        <p className="mt-2 text-xs leading-5 text-white/80">
          <b className="mr-1 text-white">{post.user}</b> {post.caption}
        </p>
        
        {post.taggedContactIds && post.taggedContactIds.length > 0 && (
          <p className="mt-1 text-[10px] text-[#e5a9b3]">
            with {post.taggedContactIds.map(cId => store.contacts.find(c => c.id === cId)?.name || cId).join(', ')}
          </p>
        )}

        {/* Since post.comments is undefined on seed, let's treat it safely */}
        {((post as any).comments?.length > 0) && (
          <p onClick={(e) => { e.stopPropagation(); onCommentClick(); }} className="mt-1 cursor-pointer text-[11px] text-white/40 hover:text-white/60">
            View all {(post as any).comments.length} comments
          </p>
        )}
      </div>

      {sharing && <ShareMenu store={store} onShare={handleShare} onCancel={() => setSharing(false)} />}
    </article>
  );
}

export function InstagramApp({ store, detail, setDetail, editMode, commit }: Props) {
  const profile = store.instagramProfile || defaultProfile;
  const highlights = store.instagramHighlights || defaultHighlights;

  const [newComment, setNewComment] = useState('');

  if (detail?.kind === 'edit-profile') {
    return <ProfileEditor store={store} onClose={() => setDetail(null)} commit={commit} />;
  }

  if (detail?.kind === 'create-post' || detail?.kind === 'edit-post') {
    return <PostEditor store={store} postId={detail.id || undefined} onClose={() => setDetail(null)} commit={commit} />;
  }

  if (detail?.kind === 'create-story' || detail?.kind === 'edit-story') {
    return <StoryEditor store={store} storyId={detail.id || undefined} onClose={() => setDetail(null)} commit={commit} />;
  }

  if (detail?.kind === 'ig-tab') {
    const highlight = highlights.find(h => h.id === detail.id);
    if (highlight) {
      return <HighlightViewer store={store} highlight={highlight} onClose={() => setDetail(null)} editMode={editMode} commit={commit} />;
    }
  }

  if (detail?.kind === 'story') {
    const storyIndex = store.instagramStories.findIndex(s => s.id === detail.id);
    if (storyIndex >= 0) {
      return (
        <StoryViewer
          story={store.instagramStories[storyIndex]}
          store={store}
          onClose={() => setDetail(null)}
          onNext={() => {
            if (storyIndex < store.instagramStories.length - 1) {
              setDetail({ kind: 'story', id: store.instagramStories[storyIndex + 1].id });
            } else {
              setDetail(null);
            }
          }}
          onPrev={() => {
            if (storyIndex > 0) {
              setDetail({ kind: 'story', id: store.instagramStories[storyIndex - 1].id });
            } else {
              setDetail(null);
            }
          }}
          onEdit={() => setDetail({ kind: 'edit-story', id: store.instagramStories[storyIndex].id })}
          editMode={editMode}
          commit={commit}
        />
      );
    }
  }

  if (detail?.kind === 'post') {
    const post = store.posts.find(p => p.id === detail.id);
    if (post) {
      const handleAddComment = () => {
        if (!newComment.trim()) return;
        commit((s: PhoneStore) => {
          const currentPost = s.posts.find(p => p.id === post.id);
          if (!currentPost) return s;
          const comments: InstagramComment[] = (currentPost as any).comments || [];
          const newC: InstagramComment = {
            id: `c-${Date.now()}`,
            user: profile.username,
            text: newComment,
            time: 'just now'
          };
          return {
            ...s,
            posts: s.posts.map(p => p.id === post.id ? { ...p, comments: [...comments, newC] } : p)
          };
        });
        setNewComment('');
      };

      return (
        <div className="flex h-full flex-col">
          <button onClick={() => setDetail(null)} className="mb-5 flex items-center gap-2 text-sm text-[#e5a9b3]" data-testid="button-post-back"><ArrowLeft size={15} /> feed</button>
          <div className="flex-1 overflow-y-auto pb-6 space-y-4">
            <PostCard
              post={post}
              store={store}
              large
              editMode={editMode}
              onLike={() => commit((s) => ({
                ...s,
                posts: s.posts.map(p => p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p)
              }))}
              onSave={() => commit((s) => ({ ...s, posts: s.posts.map(p => p.id === post.id ? { ...p, saved: !p.saved } : p) }))}
              onCommentClick={() => {}} // already viewing
              onEdit={() => setDetail({ kind: 'edit-post', id: post.id })}
            />
            
            <div className="px-4">
              <h4 className="text-[10px] uppercase tracking-[0.2em] text-white/50 mb-3">Comments</h4>
              {((post as any).comments || []).map((c: InstagramComment) => (
                <div key={c.id} className="mb-3 text-xs flex gap-3 group">
                  <Avatar initials={c.user.substring(0,2).toUpperCase()} color="#d895a6" size="sm" />
                  <div className="flex-1">
                    <p><b className="mr-1 text-white">{c.user}</b> <span className="text-white/80">{c.text}</span></p>
                    <p className="text-[10px] text-white/40 mt-0.5">{c.time}</p>
                  </div>
                  {editMode && (
                    <button onClick={() => {
                      commit((s: PhoneStore) => ({
                        ...s,
                        posts: s.posts.map(p => p.id === post.id ? { ...p, comments: (p as any).comments.filter((x: any) => x.id !== c.id) } : p)
                      }));
                    }} className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                  )}
                </div>
              ))}
              {((post as any).comments || []).length === 0 && <p className="text-xs text-white/40 mb-4">No comments yet.</p>}

              <div className="mt-6 flex items-center gap-3 bg-white/5 p-2 rounded-2xl">
                <Avatar initials={profile.username.substring(0, 2).toUpperCase()} color="#d895a6" size="sm" photoUrl={profile.imageId ? `/api/story/image/${profile.imageId}` : profile.photoDataUrl} />
                <input type="text" value={newComment} onChange={e => setNewComment(e.target.value)} placeholder={`Add a comment as ${profile.username}...`} className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40" onKeyDown={e => e.key === 'Enter' && handleAddComment()} />
                <button onClick={handleAddComment} disabled={!newComment.trim()} className="text-xs font-medium text-[#e7aabb] disabled:opacity-50">Post</button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  const createHighlight = () => {
    const name = prompt('Highlight Name:');
    if (!name) return;
    commit((s: PhoneStore) => ({
      ...s,
      instagramHighlights: [...(s.instagramHighlights || []), { id: `h-${Date.now()}`, name, storyIds: [] }]
    }));
  };

  return (
    <div>
      <div className="flex items-start gap-4">
        <Avatar initials={profile.displayName.substring(0, 1).toUpperCase()} color="#d895a6" size="lg" photoUrl={profile.imageId ? `/api/story/image/${profile.imageId}` : profile.photoDataUrl} />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div><h3 className="font-medium">{profile.username}</h3><p className="mt-1 text-xs text-white/45">{profile.displayName}{profile.location && ` · ${profile.location}`}</p>{profile.bio && <p className="mt-1 text-xs text-white/55">{profile.bio}</p>}</div>
            <button onClick={() => setDetail({ kind: 'edit-profile', id: '' })} className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] text-white/70 hover:bg-white/5 transition-colors" data-testid="button-instagram-edit-profile">edit profile</button>
          </div>
          <div className="mt-4 flex gap-5 text-center text-xs">
            <span><b className="block text-sm text-white">{store.posts.length}</b><span className="text-white/45">posts</span></span>
            <span><b className="block text-sm text-white">2.4k</b><span className="text-white/45">following</span></span>
            <span><b className="block text-sm text-white">11.8m</b><span className="text-white/45">quiet eyes</span></span>
          </div>
        </div>
      </div>

      <div className="mt-7 flex gap-4 overflow-x-auto pb-2">
        {highlights.map((x, i) => (
          <button key={x.id} onClick={() => setDetail({ kind: 'ig-tab', id: x.id })} className="shrink-0 text-center" data-testid={`button-instagram-${x.id.replace(' ', '-')}`}>
            <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full border ${i === 0 ? 'border-[#d98ca7] bg-[#d98ca7]/20' : 'border-white/15 bg-white/5'} transition-transform active:scale-95`}>
              {i === 0 ? <Heart size={16} /> : i === 1 ? <Star size={16} /> : <UserRound size={16} />}
            </span>
            <span className="mt-2 block text-[10px] text-white/55 line-clamp-1 max-w-[50px]">{x.name}</span>
          </button>
        ))}
        {editMode && (
          <button onClick={createHighlight} className="shrink-0 text-center text-white/50 hover:text-white">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-dashed border-white/30 bg-transparent transition-transform active:scale-95">
              <Plus size={16} />
            </span>
            <span className="mt-2 block text-[10px]">New</span>
          </button>
        )}
      </div>

      <SectionTitle action={editMode ? "+ story" : undefined} onAction={() => setDetail({ kind: 'create-story', id: '' })}>stories · today</SectionTitle>
      <div className="mb-7 flex gap-3 overflow-x-auto">
        <button onClick={() => setDetail({ kind: 'create-story', id: '' })} className="shrink-0 text-center" data-testid="button-story-you">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-white/20 bg-white/5 transition-transform active:scale-95">
            <span className="flex h-full w-full items-center justify-center rounded-full bg-gradient-to-br from-[#394763] via-[#9d6f88] to-[#e9bb92] text-xs text-[#291f2b]">
              <Plus size={17} />
            </span>
          </span>
          <span className="mt-1.5 block text-[10px] text-white/55">you</span>
        </button>

        {store.instagramStories.map((s, i) => {
          const hasImage = !!(s.imageId || s.dataUrl);
          return (
            <button key={s.id} onClick={() => setDetail({ kind: 'story', id: s.id })} className="shrink-0 text-center" data-testid={`button-story-${s.id}`}>
              <span className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 transition-transform active:scale-95 ${hasImage ? 'border-[#d98ca7] p-0.5' : 'border-dashed border-white/30 p-0.5'}`}>
                {hasImage ? (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-black overflow-hidden">
                    <img src={s.imageId ? `/api/story/image/${s.imageId}` : s.dataUrl} className="h-full w-full object-cover" />
                  </span>
                ) : (
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white/5 text-xs text-white/45">
                    {s.user.substring(0, 1).toUpperCase()}
                  </span>
                )}
              </span>
              <span className="mt-1.5 block text-[10px] text-white/55">{s.user}</span>
              {!hasImage && <span className="block text-[9px] text-[#e7aabb]">image needed</span>}
            </button>
          );
        })}
      </div>

            <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] uppercase tracking-[.23em] text-white/45">posts</h3>
        <button onClick={() => setDetail({ kind: 'create-post', id: '' })} className="text-xs text-[#e7aabb] hover:text-white transition-colors">+ post</button>
      </div>

      <div className="grid grid-cols-3 gap-1">
        {store.posts.map(p => {
          const imageUrl = p.imageId ? `/api/story/image/${p.imageId}` : p.dataUrl;
          return (
            <button key={p.id} onClick={() => setDetail({ kind: 'post', id: p.id })} className="relative aspect-square overflow-hidden bg-white/5 hover:opacity-90 transition-opacity">
              {imageUrl ? (
                <img src={imageUrl} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center p-2 text-center text-[10px] text-white/30 bg-gradient-to-br from-[#394763]/20 to-[#e9bb92]/20">
                  {p.caption ? p.caption.substring(0, 30) + '...' : 'No Image'}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8">
        <SectionTitle>feed</SectionTitle>
        <div className="space-y-7">
          {store.posts.map(post => <PostCard
            key={post.id}
            post={post}
            store={store}
            editMode={editMode}
            onClick={() => setDetail({ kind: 'post', id: post.id })}
            onLike={() => commit(s => ({
              ...s,
              posts: s.posts.map(p => p.id === post.id ? { ...p, liked: !p.liked, likes: p.likes + (p.liked ? -1 : 1) } : p),
            }))}
            onSave={() => commit(s => ({ ...s, posts: s.posts.map(p => p.id === post.id ? { ...p, saved: !p.saved } : p) }))}
            onCommentClick={() => setDetail({ kind: 'post', id: post.id })}
            onEdit={() => setDetail({ kind: 'edit-post', id: post.id })}
          />)}
        </div>
      </div>
    </div>
  );
}
