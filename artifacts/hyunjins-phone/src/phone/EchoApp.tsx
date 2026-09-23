import React, { useState, useMemo } from 'react';
import { 
  Plus, Search, Bookmark, User, FileText, Bell, MessageSquareQuote, 
  Heart, Repeat2, MessageCircle, ArrowLeft, Image as ImageIcon,
  MapPin, X, Trash2, Edit3, MoreHorizontal, Check, RefreshCw
} from 'lucide-react';
import type { PhoneStore, EchoPost, EchoNotification, EchoProfile, Contact } from './config';
import { ImagePicker } from './InstagramImagePicker';

type Detail = 
  | null
  | { kind: 'post', id: string }
  | { kind: 'profile', contactId?: string, username?: string } // if no contactId/username, it's Hyunjin
  | { kind: 'compose', replyToId?: string, quoteId?: string, draftId?: string }
  | { kind: 'edit-post', id: string }
  | { kind: 'edit-profile' };

function Avatar({ initials, color, size = 'md' }: { initials: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span 
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold tracking-tight text-[#251e2b] ${size === 'sm' ? 'h-8 w-8 text-[10px]' : size === 'lg' ? 'h-16 w-16 text-lg' : 'h-11 w-11 text-xs'}`} 
      style={{ background: `linear-gradient(145deg, ${color}, #f2d7bb)` }} 
    >
      {initials}
    </span>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex items-center justify-between"><h3 className="text-[10px] uppercase tracking-[.23em] text-white/45">{children}</h3></div>;
}

function echoContactName(contact: Contact | undefined, fallback: string) {
  return contact?.id === 'c1' && contact.name.toLowerCase() === 'antonella' ? 'Nela' : contact?.name || fallback;
}

export function EchoApp({ store, setStore, editMode }: { store: PhoneStore; setStore: React.Dispatch<React.SetStateAction<PhoneStore>>; editMode: boolean }) {
  const [tab, setTab] = useState<'timeline' | 'profile' | 'search' | 'activity' | 'bookmarks' | 'drafts'>('timeline');
  const [detail, setDetail] = useState<Detail>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<'posts' | 'replies' | 'media' | 'likes'>('posts');

  const myProfile = store.echoProfile;
  const posts = store.echoPosts || [];
  const drafts = store.echoDrafts || [];
  const handles = store.echoAccountHandles || {};

  const commit = (updater: (s: PhoneStore) => PhoneStore) => {
    setStore(updater);
  };
  const hasEchoAccount = (id: string) => id === 'c1' || posts.some(post => post.contactId === id);

  const getAuthorInfo = (post: EchoPost) => {
    let contactId = post.contactId;
    if (!contactId && (post.author === 'Antonella' || post.handle === '@antocastillo' || post.author === 'Nela' || post.handle === '@nela')) {
      contactId = 'c1';
    }

    if (post.author === 'hyune' || post.author === myProfile.username.replace('@', '')) {
      return {
        name: myProfile.displayName,
        handle: myProfile.username,
        initials: myProfile.displayName.charAt(0).toUpperCase(),
        color: '#a293b6',
        isMe: true,
      };
    }
    if (contactId) {
      const contact = store.contacts.find(c => c.id === contactId);
      const name = echoContactName(contact, post.author);
      const handle = handles[contactId] || (contactId === 'c1' && contact?.name.toLowerCase() === 'antonella' ? '@nela' : `@${name.toLowerCase().replace(/\s+/g, '')}`);
      return {
        name,
        handle,
        initials: contact?.initials || name.charAt(0).toUpperCase(),
        color: contact?.color || '#8fa8c0',
        isMe: false,
      };
    }
    return {
      name: post.author,
      handle: post.handle,
      initials: post.author.charAt(0).toUpperCase(),
      color: '#8fa8c0',
      isMe: false,
    };
  };

  const formatTextWithMentions = (text: string) => {
    const words = text.split(/(\s+)/);
    return words.map((w, i) => {
      const match = w.match(/^(@\w+)([.,!?]*)$/);
      if (match) {
        const handle = match[1];
        const punctuation = match[2];
        
        let isKnown = false;
        if (handle.toLowerCase() === myProfile.username.toLowerCase()) {
          isKnown = true;
        } else if (Object.values(handles).map(h => h.toLowerCase()).includes(handle.toLowerCase())) {
          isKnown = true;
        } else if (store.echoPosts.some(p => p.handle?.toLowerCase() === handle.toLowerCase())) {
          isKnown = true;
        } else {
          const defaultHandles = store.contacts.filter(c => hasEchoAccount(c.id)).map(c => `@${echoContactName(c, c.name).toLowerCase().replace(/\s+/g, '')}`);
          if (defaultHandles.includes(handle.toLowerCase())) {
            isKnown = true;
          }
        }

        if (isKnown) {
          return (
            <React.Fragment key={i}>
              <span className="text-[#a293b6] cursor-pointer hover:underline" onClick={(e) => { e.stopPropagation(); setDetail({ kind: 'profile', username: handle }); }}>{handle}</span>
              {punctuation}
            </React.Fragment>
          );
        }
      }
      return w;
    });
  };

  // Subcomponents
  const PostCard = ({ post, isQuoted = false }: { post: EchoPost, isQuoted?: boolean }) => {
    const info = getAuthorInfo(post);
    const liked = post.likedByHyunjin || post.isLiked;
    const reposted = post.repostedByHyunjin || post.isReposted;
    const saved = post.saved;

    const [showRepostMenu, setShowRepostMenu] = useState(false);

    const handleLike = (e: React.MouseEvent) => {
      e.stopPropagation();
      commit(s => {
        const p = s.echoPosts.find(x => x.id === post.id);
        if (!p) return s;
        const willLike = !(p.likedByHyunjin || p.isLiked);
        return {
          ...s,
          echoPosts: s.echoPosts.map(x => x.id === post.id ? { ...x, likedByHyunjin: willLike, isLiked: willLike, likes: Math.max(0, x.likes + (willLike ? 1 : -1)) } : x)
        };
      });
    };

    const handleSave = (e: React.MouseEvent) => {
      e.stopPropagation();
      commit(s => ({
        ...s,
        echoPosts: s.echoPosts.map(x => x.id === post.id ? { ...x, saved: !x.saved } : x)
      }));
    };

    const handleRepostToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRepostMenu(!showRepostMenu);
    };

    const doRepost = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowRepostMenu(false);
      commit(s => {
        const p = s.echoPosts.find(x => x.id === post.id);
        if (!p) return s;
        const willRepost = !(p.repostedByHyunjin || p.isReposted);
        const newPosts = s.echoPosts.map(x => x.id === post.id ? { ...x, repostedByHyunjin: willRepost, isReposted: willRepost, reposts: Math.max(0, x.reposts + (willRepost ? 1 : -1)) } : x);
        if (willRepost) {
          const repostEntry: EchoPost = {
            id: `ep-${Date.now()}`,
            author: myProfile.username.replace('@', ''),
            handle: myProfile.username,
            content: '',
            time: 'just now',
            likes: 0, reposts: 0, replies: 0,
            quotedPostId: post.id,
            isRepost: true,
             createdAt: new Date().toISOString(),
             source: 'manual',
          };
          newPosts.unshift(repostEntry);
        } else {
          const repostIdx = newPosts.findIndex(x => x.isRepost && x.quotedPostId === post.id && x.author === myProfile.username.replace('@', ''));
          if (repostIdx >= 0) newPosts.splice(repostIdx, 1);
        }
        return { ...s, echoPosts: newPosts };
      });
    };

    const openProfile = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (info.isMe) setDetail({ kind: 'profile' });
      else setDetail({ kind: 'profile', contactId: post.contactId || (info.name === 'Nela' ? 'c1' : undefined), username: info.handle });
    };

    let imageUrl = post.imageId ? `/api/story/image/${post.imageId}` : post.dataUrl;
    let isBrokenImage = false;
    
    if (!imageUrl && post.galleryId) {
      const gItem = store.gallery?.find(g => g.id === post.galleryId);
      if (gItem) {
        imageUrl = gItem.imageId ? `/api/story/image/${gItem.imageId}` : gItem.dataUrl;
      } else {
        isBrokenImage = true;
      }
    }

    const quotedPost = post.quotedPostId ? posts.find(p => p.id === post.quotedPostId) : null;
    const isQuoteDeleted = post.quotedPostId && !quotedPost;

    if (post.isRepost && !isQuoted) {
      if (isQuoteDeleted) {
        return (
          <div className="relative pb-4 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors">
            <div className="mb-1 flex items-center gap-2 text-[#a293b6] text-[10px] pl-6" onClick={openProfile}>
              <Repeat2 size={12} /> {info.name} reposted
            </div>
            <div className="rounded-xl border border-white/10 p-3 bg-white/[.02] text-xs text-white/40">
              [ Original post was deleted ]
            </div>
          </div>
        );
      }
      if (quotedPost) {
        return (
          <div className="relative pb-4 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors" onClick={() => setDetail({ kind: 'post', id: quotedPost.id })}>
            <div className="mb-1 flex items-center gap-2 text-[#a293b6] text-[10px] pl-6" onClick={openProfile}>
              <Repeat2 size={12} /> {info.name} reposted
            </div>
            <PostCard post={quotedPost} />
          </div>
        );
      }
    }

    return (
      <div className={`relative ${isQuoted ? 'border border-white/10 rounded-xl p-3 bg-white/[.02] mt-2' : 'pb-4 cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded-xl transition-colors'}`} onClick={() => { if (!isQuoted) setDetail({ kind: 'post', id: post.id }) }}>
        {!isQuoted && (
          <div className="absolute -left-[27px] top-2 rounded-full border-4 border-[#12111d] bg-[#12111d] z-10" onClick={openProfile}>
            <Avatar initials={info.initials} color={info.color} size="sm" />
          </div>
        )}
        
        <div className="flex justify-between items-start">
          <div className="mb-1 flex items-baseline gap-2" onClick={openProfile}>
            {isQuoted && <Avatar initials={info.initials} color={info.color} size="sm" />}
            <span className="font-semibold hover:underline">{info.name}</span>
            <span className="text-[10px] text-white/40">{info.handle} · {post.time}</span>
          </div>
          {editMode && !isQuoted && (
            <button onClick={(e) => { e.stopPropagation(); setDetail({ kind: 'edit-post', id: post.id }); }} className="text-white/30 hover:text-white"><MoreHorizontal size={14} /></button>
          )}
        </div>
        
        <p className="text-sm leading-6 text-white/80 whitespace-pre-wrap mt-1">{formatTextWithMentions(post.content)}</p>
        
        {imageUrl ? (
          <div className="mt-3 rounded-2xl overflow-hidden border border-white/10 bg-white/5 max-h-60" onClick={(e) => { e.stopPropagation(); setFullScreenImage(imageUrl!); }}>
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        ) : isBrokenImage ? (
          <div className="mt-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-xs text-white/40">
            [ Image unavailable ]
          </div>
        ) : null}

        {quotedPost && !isQuoted && (
          <PostCard post={quotedPost} isQuoted={true} />
        )}
        {isQuoteDeleted && !isQuoted && (
          <div className="mt-3 rounded-xl border border-white/10 p-3 bg-white/[.02] text-xs text-white/40">
            [ Original post was deleted ]
          </div>
        )}

        {!isQuoted && (
          <div className="mt-3 flex gap-6 text-xs text-white/40">
            <button className="flex items-center gap-1.5 hover:text-[#a293b6]" onClick={(e) => { e.stopPropagation(); setDetail({ kind: 'compose', replyToId: post.id }); }}>
              <MessageCircle size={14} />{post.replies > 0 ? post.replies : ''}
            </button>
            <div className="relative">
              <button className={`flex items-center gap-1.5 hover:text-[#a293b6] ${reposted ? 'text-[#a293b6]' : ''}`} onClick={handleRepostToggle}>
                <Repeat2 size={14} />{post.reposts > 0 ? post.reposts : ''}
              </button>
              {showRepostMenu && (
                <div className="absolute top-full left-0 mt-1 w-32 bg-[#251e2b] border border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                  <button className="w-full text-left px-4 py-2 text-xs hover:bg-white/10" onClick={doRepost}>{reposted ? 'Undo Repost' : 'Repost'}</button>
                  <button className="w-full text-left px-4 py-2 text-xs hover:bg-white/10" onClick={(e) => { e.stopPropagation(); setShowRepostMenu(false); setDetail({ kind: 'compose', quoteId: post.id }); }}>Quote Post</button>
                  <button className="w-full text-left px-4 py-2 text-xs hover:bg-white/10 text-white/50" onClick={(e) => { e.stopPropagation(); setShowRepostMenu(false); }}>Cancel</button>
                </div>
              )}
            </div>
            <button className={`flex items-center gap-1.5 hover:text-[#e7aabb] ${liked ? 'text-[#e7aabb]' : ''}`} onClick={handleLike}>
              <Heart size={14} fill={liked ? 'currentColor' : 'none'} />{post.likes > 0 ? post.likes : ''}
            </button>
            <button className={`ml-auto flex items-center gap-1.5 hover:text-[#bba78d] ${saved ? 'text-[#bba78d]' : ''}`} onClick={handleSave}>
              <Bookmark size={14} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        )}
      </div>
    );
  };

  // Renders
  if (fullScreenImage) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl">
        <div className="flex p-4 items-center justify-between">
          <button onClick={() => setFullScreenImage(null)} className="text-white/50 hover:text-white"><X size={24} /></button>
        </div>
        <div className="flex-1 flex items-center justify-center overflow-hidden p-4" onClick={() => setFullScreenImage(null)}>
          <img src={fullScreenImage} className="max-w-full max-h-full object-contain" />
        </div>
      </div>
    );
  }

  if (detail?.kind === 'post') {
    const post = posts.find(p => p.id === detail.id);
    if (!post) return <div className="p-4 text-white"><button onClick={() => setDetail(null)}><ArrowLeft /></button> Post not found</div>;
    
    const replies: EchoPost[] = [];
    const seen = new Set([post.id]);
    const collectReplies = (parentId: string) => {
      posts.filter(p => p.replyToId === parentId).forEach(reply => {
        if (seen.has(reply.id)) return;
        seen.add(reply.id);
        replies.push(reply);
        collectReplies(reply.id);
      });
    };
    collectReplies(post.id);
    const parent = post.replyToId ? posts.find(p => p.id === post.replyToId) : null;

    return (
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-center gap-4 border-b border-white/10 pb-4">
          <button onClick={() => setDetail(null)} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
          <span className="font-serif text-xl">Echo</span>
        </div>
        <div className="flex-1 overflow-y-auto pb-10 space-y-4 border-l-2 border-white/10 pl-4 ml-6 mr-2">
          {parent && (
            <div className="opacity-70">
              <PostCard post={parent} />
            </div>
          )}
          <div className="bg-white/5 -mx-4 p-4 rounded-xl relative">
            <div className="absolute -left-[27px] top-6 rounded-full border-4 border-[#12111d] bg-[#12111d]">
              <Avatar initials={getAuthorInfo(post).initials} color={getAuthorInfo(post).color} size="md" />
            </div>
            <div className="pl-2">
              <PostCard post={post} />
            </div>
          </div>
          {replies.map(r => <PostCard key={r.id} post={r} />)}
          {replies.length === 0 && <p className="text-center text-xs text-white/40 mt-10">No replies yet.</p>}
        </div>
        <div className="p-4 border-t border-white/10 bg-[#12111d]">
          <button onClick={() => setDetail({ kind: 'compose', replyToId: post.id })} className="w-full text-left bg-white/5 border border-white/10 rounded-full px-4 py-3 text-sm text-white/50">Reply to {getAuthorInfo(post).handle}...</button>
        </div>
      </div>
    );
  }

  const renderProfileContent = (contactId?: string, username?: string, isRootTab: boolean = false) => {
    const isMe = !contactId && !username;
    let profileInfo: any = {};
    if (isMe) {
      profileInfo = { name: myProfile.displayName, handle: myProfile.username, bio: myProfile.bio, initials: myProfile.displayName.charAt(0).toUpperCase(), color: '#a293b6', contactId: null };
    } else {
      let contact;
      if (contactId) {
        contact = store.contacts.find(c => c.id === contactId);
      } else if (username) {
        const cId = Object.keys(handles).find(k => handles[k] === username);
        if (cId) contact = store.contacts.find(c => c.id === cId);
      }
      
       const name = echoContactName(contact, username?.replace('@', '') || 'User');
       const handle = handles[contact?.id || ''] || (contact?.id === 'c1' && contact.name.toLowerCase() === 'antonella' ? '@nela' : username || `@${name.toLowerCase()}`);
      profileInfo = { name, handle, bio: contact?.notes || '', initials: contact?.initials || name.charAt(0).toUpperCase(), color: contact?.color || '#8fa8c0', contactId: contact?.id };
    }

    const userPosts = posts.filter(p => {
      if (isMe) return p.author === 'hyune' || p.author === myProfile.username.replace('@', '');
       return p.contactId === profileInfo.contactId ||
         (profileInfo.contactId === 'c1' && !p.contactId && (p.author === 'Antonella' || p.handle === '@antocastillo')) ||
         p.handle === profileInfo.handle || p.author === profileInfo.name;
    });

    const pRootPosts = userPosts.filter(p => !p.replyToId && !p.isRepost);
    const pReplies = userPosts.filter(p => !!p.replyToId);
    const pMedia = userPosts.filter(p => !!p.imageId || !!p.dataUrl || !!p.galleryId);
    const pLikes = posts.filter(p => p.likedByHyunjin || p.isLiked);

    const displayedPosts = profileTab === 'posts' ? pRootPosts : profileTab === 'replies' ? pReplies : profileTab === 'media' ? pMedia : isMe ? pLikes : [];

    const content = (
      <>
        {isRootTab && isMe && editMode && (
           <div className="flex justify-end mb-2">
             <button onClick={() => setDetail({ kind: 'edit-profile' })} className="text-[10px] text-[#a293b6] uppercase tracking-wider">Edit Profile</button>
           </div>
        )}
        <div className="flex flex-col items-center pb-6 text-center">
          <Avatar initials={profileInfo.initials} color={profileInfo.color} size="lg" />
          <h2 className="mt-4 font-serif text-3xl">{profileInfo.name}</h2>
          <p className="mt-1 text-xs text-white/40">{profileInfo.handle}</p>
          <p className="mt-4 max-w-[250px] text-sm text-white/70 whitespace-pre-wrap">{profileInfo.bio}</p>
          <div className="mt-4 flex gap-6 text-xs">
            <span><b className="text-white">128</b> following</span>
            <span><b className="text-white">14.2k</b> followers</span>
          </div>
        </div>
        <div className="border-y border-white/10 flex text-xs">
          {['posts', 'replies', 'media'].map(t => (
            <button key={t} onClick={() => setProfileTab(t as any)} className={`flex-1 py-3 capitalize ${profileTab === t ? 'text-[#a293b6] border-b-2 border-[#a293b6]' : 'text-white/40'}`}>{t}</button>
          ))}
          {isMe && <button onClick={() => setProfileTab('likes')} className={`flex-1 py-3 capitalize ${profileTab === 'likes' ? 'text-[#a293b6] border-b-2 border-[#a293b6]' : 'text-white/40'}`}>Likes</button>}
        </div>
        <div className="mt-6 space-y-5 border-l-2 border-white/10 pl-4 ml-6 mr-2">
          {displayedPosts.map(p => <PostCard key={p.id} post={p} />)}
          {displayedPosts.length === 0 && <p className="text-center text-xs text-white/40 mt-10">No {profileTab} found.</p>}
        </div>
      </>
    );

    if (isRootTab) {
      return <div className="mt-2">{content}</div>;
    }

    return (
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => setDetail(null)} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
            <span className="font-medium text-sm">{profileInfo.handle}</span>
          </div>
          {isMe && editMode ? (
             <button onClick={() => setDetail({ kind: 'edit-profile' })} className="text-[10px] text-[#a293b6] uppercase tracking-wider">Edit</button>
          ) : <div className="w-5" />}
        </div>
        <div className="flex-1 overflow-y-auto">
          {content}
        </div>
      </div>
    );
  };

  if (detail?.kind === 'profile') {
    return renderProfileContent(detail.contactId, detail.username, false);
  }

  if (detail?.kind === 'compose') {
    return <ComposeView store={store} commit={commit} detail={detail} onClose={() => setDetail(null)} myProfile={myProfile} editMode={editMode} handles={handles} />;
  }

  if (detail?.kind === 'edit-post') {
    return <EditPostView store={store} commit={commit} postId={detail.id} onClose={() => setDetail(null)} myProfile={myProfile} handles={handles} />;
  }

  if (detail?.kind === 'edit-profile') {
    return <EditProfileView store={store} commit={commit} onClose={() => setDetail(null)} />;
  }

  // Timeline & Tabs Data
  const rootPosts = posts.filter(p => !p.replyToId);
  const searchedPosts = searchQuery.trim() ? posts.filter(p => p.content.toLowerCase().includes(searchQuery.toLowerCase()) || getAuthorInfo(p).name.toLowerCase().includes(searchQuery.toLowerCase()) || getAuthorInfo(p).handle.toLowerCase().includes(searchQuery.toLowerCase())) : [];
  
  const searchedContacts = searchQuery.trim() ? store.contacts.filter(c => {
    const handle = handles[c.id] || '';
    return hasEchoAccount(c.id) && (echoContactName(c, c.name).toLowerCase().includes(searchQuery.toLowerCase()) || handle.toLowerCase().includes(searchQuery.toLowerCase()));
  }) : [];

  const savedPosts = posts.filter(p => p.saved);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-4xl">Echo</h1>
        {editMode ? (
          <div className="flex gap-2">
            <button onClick={() => setDetail({ kind: 'compose' })} className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-white/60 hover:bg-white/20">New Post (Edit)</button>
          </div>
        ) : (
          <button onClick={() => setDetail({ kind: 'compose' })} className="rounded-full bg-[#a293b6] p-2 text-black"><Plus size={18} /></button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pb-16">
        {tab === 'timeline' && (
          <div className="space-y-5 border-l-2 border-white/10 pl-4 ml-6 mr-2 mt-2">
            {rootPosts.map(p => <PostCard key={p.id} post={p} />)}
            {rootPosts.length === 0 && <p className="text-xs text-white/40">No echoes yet.</p>}
          </div>
        )}

        {tab === 'profile' && renderProfileContent(undefined, undefined, true)}

        {tab === 'drafts' && <div className="space-y-3">
          <SectionTitle>saved drafts</SectionTitle>
          {drafts.map(p => (
            <div key={p.id} className="rounded-2xl border border-white/10 bg-white/5 p-4 cursor-pointer hover:bg-white/10" onClick={() => setDetail({ kind: 'compose', draftId: p.id })}>
              <p className="text-sm whitespace-pre-wrap">{p.content || '(empty)'}</p>
              <div className="flex justify-between mt-2">
                <p className="text-[10px] text-white/40">{p.time}</p>
                <button onClick={(e) => { e.stopPropagation(); commit(s => ({ ...s, echoDrafts: s.echoDrafts.filter(d => d.id !== p.id) })); }} className="text-red-400/50 hover:text-red-400"><Trash2 size={12} /></button>
              </div>
            </div>
          ))}
          {!drafts.length && <p className="text-sm text-white/40">No drafts yet.</p>}
        </div>}
        
        {tab === 'activity' && (
          <div className="space-y-4">
            <SectionTitle>Recent Activity</SectionTitle>
            {store.echoNotifications.map(n => {
               let contactId = n.contactId;
               if (!contactId && (n.user === '@antocastillo' || n.user === '@nela' || n.user === 'Nela' || n.user === 'Antonella')) {
                 contactId = 'c1';
               }
               const contact = contactId ? store.contacts.find(c => c.id === contactId) : null;
               
               let handle = n.user;
               let name = n.user.replace('@', '');
               
               if (contact) {
                 handle = handles[contact.id] || `@${contact.name.toLowerCase().replace(/\s+/g, '')}`;
                  name = echoContactName(contact, contact.name);
               }
               
                return (
                 <div key={n.id} className={`flex gap-4 rounded-xl border border-white/5 bg-white/[.02] p-4 ${n.postId || contactId ? 'cursor-pointer hover:bg-white/5' : ''}`} onClick={() => { if (n.postId) setDetail({ kind: 'post', id: n.postId }); else if (contactId) setDetail({ kind: 'profile', contactId: contactId }); }}>
                  <span className="text-[#a293b6] mt-1">
                    {n.type === 'like' ? <Heart size={20} fill="currentColor" /> : n.type === 'reply' || n.type === 'mention' ? <MessageCircle size={20} fill="currentColor" /> : <Repeat2 size={20} />}
                  </span>
                  <div>
                    <p className="text-sm"><span className="font-semibold text-white">{name}</span> <span className="text-white/70">{n.text}</span></p>
                    <p className="mt-1 text-[10px] text-white/40">{n.time}</p>
                  </div>
                </div>
              );
            })}
            {!store.echoNotifications.length && <p className="text-sm text-white/40">No activity yet.</p>}
          </div>
        )}

        {tab === 'search' && (
          <div>
            <div className="mb-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <Search size={16} className="text-white/40" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search Echo" className="flex-1 bg-transparent text-sm outline-none placeholder:text-white/40 text-white" />
              {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} className="text-white/40" /></button>}
            </div>
            
            {searchQuery.trim() ? (
              <div className="space-y-6">
                {searchedContacts.length > 0 && (
                  <div>
                    <SectionTitle>Accounts</SectionTitle>
                    <div className="space-y-3">
                      {searchedContacts.map(c => {
                         const displayName = echoContactName(c, c.name);
                         const handle = handles[c.id] || `@${displayName.toLowerCase().replace(/\s+/g, '')}`;
                        return (
                          <div key={c.id} className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl cursor-pointer" onClick={() => setDetail({ kind: 'profile', contactId: c.id })}>
                            <Avatar initials={c.initials} color={c.color} />
                            <div>
                               <p className="text-sm font-medium">{displayName}</p>
                              <p className="text-[10px] text-white/40">{handle}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div>
                  <SectionTitle>Posts</SectionTitle>
                  <div className="space-y-4 border-l-2 border-white/10 pl-4 ml-6 mr-2 mt-2">
                    {searchedPosts.map(p => <PostCard key={p.id} post={p} />)}
                    {searchedPosts.length === 0 && <p className="text-xs text-white/40">No posts found for "{searchQuery}".</p>}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <SectionTitle>Trends</SectionTitle>
                <div className="space-y-4">
                  {['#midnightwalk', 'Seoul Rain', 'Studio Nights', 'Analog Film'].map((t, i) => (
                    <div key={t} className="flex justify-between border-b border-white/5 pb-4 cursor-pointer hover:opacity-70" onClick={() => setSearchQuery(t)}>
                      <div>
                        <p className="text-[10px] text-white/40">{i + 1} · Trending</p>
                        <p className="mt-1 font-medium text-white">{t}</p>
                        <p className="mt-1 text-[10px] text-white/40">{Math.floor(Math.random() * 10) + 1}k echoes</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'bookmarks' && (
          <div className="space-y-5 border-l-2 border-white/10 pl-4 ml-6 mr-2 mt-2">
            {savedPosts.length > 0 ? (
              savedPosts.map(p => <PostCard key={p.id} post={p} />)
            ) : (
              <div className="flex flex-col items-center justify-center pt-20 text-center text-white/40">
                <Bookmark size={40} className="mb-4 text-[#a293b6]/50" />
                <p className="text-sm">No saved echoes yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-[10px] text-white/50">
        <button onClick={() => setTab('timeline')} className={`flex flex-col items-center gap-1 ${tab === 'timeline' ? 'text-[#a293b6]' : ''}`}><MessageSquareQuote size={20} />Home</button>
        <button onClick={() => setTab('search')} className={`flex flex-col items-center gap-1 ${tab === 'search' ? 'text-[#a293b6]' : ''}`}><Search size={20} />Search</button>
        <button onClick={() => setTab('activity')} className={`flex flex-col items-center gap-1 ${tab === 'activity' ? 'text-[#a293b6]' : ''}`}><Bell size={20} />Activity</button>
        <button onClick={() => setTab('bookmarks')} className={`flex flex-col items-center gap-1 ${tab === 'bookmarks' ? 'text-[#a293b6]' : ''}`}><Bookmark size={20} />Saved</button>
        <button onClick={() => { setDetail(null); setTab('profile'); }} className={`flex flex-col items-center gap-1 ${tab === 'profile' && !detail ? 'text-[#a293b6]' : ''}`}><User size={20} />Profile</button>
        <button onClick={() => setTab('drafts')} className={`flex flex-col items-center gap-1 ${tab === 'drafts' ? 'text-[#a293b6]' : ''}`}><FileText size={20} />Drafts</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// Subviews
// ---------------------------------------------------------

function ComposeView({ store, commit, detail, onClose, myProfile, editMode, handles }: { store: PhoneStore, commit: any, detail: any, onClose: () => void, myProfile: EchoProfile, editMode: boolean, handles: Record<string, string> }) {
  const isDraft = !!detail.draftId;
  const draft = isDraft ? store.echoDrafts.find(d => d.id === detail.draftId) : null;

  const [text, setText] = useState(draft ? draft.content : '');
  const [image, setImage] = useState<{ imageId?: string, dataUrl?: string, source?: string, galleryId?: string } | null>(
    draft && (draft.imageId || draft.dataUrl || draft.galleryId) ? { imageId: draft.imageId, dataUrl: draft.dataUrl, galleryId: draft.galleryId } : null
  );
  const [location, setLocation] = useState(draft ? draft.location : '');
  const [pickingImage, setPickingImage] = useState(false);
  const [authorContactId, setAuthorContactId] = useState('ME');

  const replyToId = detail.replyToId || draft?.replyToId;
  const quoteId = detail.quoteId || draft?.quotedPostId;

  const replyToPost = replyToId ? store.echoPosts.find(p => p.id === replyToId) : null;
  const quotePost = quoteId ? store.echoPosts.find(p => p.id === quoteId) : null;

  const handlePost = () => {
    if (!text.trim() && !image) return;

    let author = myProfile.username.replace('@', '');
    let handle = myProfile.username;
    let contactId: string | undefined = undefined;

    if (authorContactId !== 'ME') {
      const c = store.contacts.find(x => x.id === authorContactId);
      if (c) {
        author = c.name;
        handle = handles[c.id] || `@${c.name.toLowerCase().replace(/\s+/g, '')}`;
        contactId = c.id;
      }
    }

    const newPost: EchoPost = {
      id: `ep-${Date.now()}`,
      author,
      handle,
      contactId,
      content: text,
      time: 'just now',
      likes: 0, reposts: 0, replies: 0,
      createdAt: new Date().toISOString(),
      imageId: image?.imageId,
      dataUrl: image?.dataUrl,
      galleryId: image?.galleryId,
      location: location || undefined,
      replyToId,
      quotedPostId: quoteId,
      source: 'manual'
    };

    commit((s: PhoneStore) => {
      let draftUpdates = s.echoDrafts;
      if (isDraft) draftUpdates = draftUpdates.filter(d => d.id !== detail.draftId);
      
      let postUpdates = s.echoPosts;
      if (replyToId) {
        postUpdates = postUpdates.map(p => p.id === replyToId ? { ...p, replies: p.replies + 1 } : p);
      }
      if (quoteId) {
        postUpdates = postUpdates.map(p => p.id === quoteId ? { ...p, reposts: p.reposts + 1 } : p);
      }

      return {
        ...s,
        echoPosts: [newPost, ...postUpdates],
        echoDrafts: draftUpdates
      };
    });
    onClose();
  };

  const handleSaveDraft = () => {
    if (!text.trim() && !image) return onClose();
    commit((s: PhoneStore) => {
      const newDraft: EchoPost = { 
        id: isDraft ? detail.draftId : `draft-${Date.now()}`, 
        author: '', handle: '', likes: 0, reposts: 0, replies: 0,
        content: text, 
        location, 
        time: 'just now',
        imageId: image?.imageId,
        dataUrl: image?.dataUrl,
        galleryId: image?.galleryId,
        replyToId,
        quotedPostId: quoteId
      };
      const drafts = isDraft ? s.echoDrafts.map(d => d.id === detail.draftId ? newDraft : d) : [newDraft, ...s.echoDrafts];
      return { ...s, echoDrafts: drafts };
    });
    onClose();
  };

  if (pickingImage) {
    return (
      <div className="absolute inset-0 z-50 bg-[#12111d]">
        <ImagePicker store={store} commit={commit} initialTab="gallery" onCancel={() => setPickingImage(false)} onSelect={(res) => { 
          let galleryId = undefined;
          if (res.source === 'gallery' && res.imageId) {
            const match = store.gallery?.find(g => g.imageId === res.imageId);
            if (match) galleryId = match.id;
          } else if (res.source === 'gallery' && res.dataUrl) {
            const match = store.gallery?.find(g => g.dataUrl === res.dataUrl);
            if (match) galleryId = match.id;
          }
          setImage({ ...res, galleryId }); 
          setPickingImage(false); 
        }} />
      </div>
    );
  }

  let composeImageUrl = image?.imageId ? `/api/story/image/${image.imageId}` : image?.dataUrl;
  if (!composeImageUrl && image?.galleryId) {
    const gItem = store.gallery?.find(g => g.id === image.galleryId);
    if (gItem) composeImageUrl = gItem.imageId ? `/api/story/image/${gItem.imageId}` : gItem.dataUrl;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-4">
        <button onClick={onClose} className="text-white/50 hover:text-white">Cancel</button>
        <button onClick={handleSaveDraft} className="text-[10px] text-white/50 uppercase tracking-wider hover:text-white">Save Draft</button>
        <button onClick={handlePost} disabled={!text.trim() && !image} className="rounded-full bg-[#a293b6] px-4 py-1.5 text-xs font-medium text-black disabled:opacity-50">Post</button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {editMode && (
          <div className="mb-4 px-4 py-2 bg-white/5 border-b border-white/10">
            <label className="text-[10px] text-white/50 uppercase tracking-widest mr-2">Post As:</label>
            <select value={authorContactId} onChange={e => setAuthorContactId(e.target.value)} className="bg-transparent text-sm text-[#a293b6] outline-none">
              <option value="ME">Hyunjin (Me)</option>
              {store.contacts.map(c => <option key={c.id} value={c.id}>{echoContactName(c, c.name)}</option>)}
            </select>
          </div>
        )}

        {replyToPost && (
          <div className="mb-4 ml-2 border-l-2 border-white/10 pl-4 opacity-70">
            <p className="text-xs font-medium">{replyToPost.handle}</p>
            <p className="text-sm line-clamp-2 mt-1">{replyToPost.content}</p>
            <p className="text-[10px] text-[#a293b6] mt-2">Replying to {replyToPost.handle}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Avatar initials={myProfile.displayName.charAt(0).toUpperCase()} color="#a293b6" />
          <div className="flex-1">
            <textarea 
              value={text} onChange={e => setText(e.target.value)} 
              placeholder={replyToPost ? "Post your reply" : quotePost ? "Add a comment..." : "What's happening?"}
              className="w-full bg-transparent text-sm text-white placeholder:text-white/40 outline-none resize-none min-h-[120px]"
              autoFocus
            />
            {composeImageUrl && (
              <div className="relative mt-2 rounded-xl overflow-hidden inline-block border border-white/10 max-h-40">
                <img src={composeImageUrl} className="h-full object-cover" />
                <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/50 p-1 rounded-full text-white hover:bg-black/80"><X size={14}/></button>
              </div>
            )}
            {quotePost && (
              <div className="mt-4 rounded-xl border border-white/10 p-3 bg-white/5">
                <p className="text-xs font-medium">{quotePost.handle}</p>
                <p className="text-sm mt-1">{quotePost.content}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-white/10 pt-4 flex items-center gap-4 text-[#a293b6]">
        <button onClick={() => setPickingImage(true)} className="hover:text-white transition-colors"><ImageIcon size={20} /></button>
        <button onClick={() => {
          const loc = prompt("Add location:", location);
          if (loc !== null) setLocation(loc);
        }} className={`hover:text-white transition-colors ${location ? 'text-[#a293b6]' : 'text-[#a293b6]/50'}`}><MapPin size={20} /></button>
        {location && <span className="text-[10px] text-white/50 bg-white/10 px-2 py-1 rounded-full flex items-center gap-1">{location} <X size={10} className="cursor-pointer" onClick={() => setLocation('')} /></span>}
      </div>
    </div>
  );
}

function EditPostView({ store, commit, postId, onClose, myProfile, handles }: { store: PhoneStore, commit: any, postId: string, onClose: () => void, myProfile: EchoProfile, handles: Record<string, string> }) {
  const post = store.echoPosts.find(p => p.id === postId);
  if (!post) return null;

  const [content, setContent] = useState(post.content);
  const [likes, setLikes] = useState(post.likes.toString());
  const [reposts, setReposts] = useState(post.reposts.toString());
  const [replies, setReplies] = useState(post.replies.toString());
  const [time, setTime] = useState(post.time);
  const [authorContactId, setAuthorContactId] = useState(post.contactId || (post.author === myProfile.username.replace('@','') || post.author === 'hyune' ? 'ME' : ''));
  const [pickingImage, setPickingImage] = useState(false);

  const save = () => {
    commit((s: PhoneStore) => {
      let newAuthor = post.author;
      let newHandle = post.handle;
      let newContactId: string | undefined = authorContactId;

      if (authorContactId === 'ME') {
        newAuthor = myProfile.username.replace('@','');
        newHandle = myProfile.username;
        newContactId = undefined;
      } else if (authorContactId) {
        const c = s.contacts.find(x => x.id === authorContactId);
        if (c) {
          newAuthor = c.name;
          newHandle = handles[c.id] || `@${c.name.toLowerCase().replace(/\s+/g,'')}`;
        }
      }

      return {
        ...s,
        echoPosts: s.echoPosts.map(p => p.id === postId ? {
          ...p,
          content, time,
          likes: parseInt(likes) || 0,
          reposts: parseInt(reposts) || 0,
          replies: parseInt(replies) || 0,
          author: newAuthor,
          handle: newHandle,
          contactId: newContactId
        } : p)
      };
    });
    onClose();
  };

  const deletePost = () => {
    const isParent = store.echoPosts.some(p => p.replyToId === postId);
    const msg = isParent ? "Delete this post and all its replies?" : "Delete this post?";
    
    if (confirm(msg)) {
      commit((s: PhoneStore) => {
        let newPosts = s.echoPosts;
        
        if (post.replyToId) {
          newPosts = newPosts.map(p => p.id === post.replyToId ? { ...p, replies: Math.max(0, p.replies - 1) } : p);
        }

        const postsToRemove = new Set([postId]);
        
        if (isParent) {
          s.echoPosts.filter(p => p.replyToId === postId).forEach(p => postsToRemove.add(p.id));
        }
        
        s.echoPosts.filter(p => p.isRepost && p.quotedPostId === postId).forEach(p => postsToRemove.add(p.id));

        newPosts = newPosts.filter(p => !postsToRemove.has(p.id));
        const newNotifs = s.echoNotifications.filter(n => !n.postId || !postsToRemove.has(n.postId));

        return { ...s, echoPosts: newPosts, echoNotifications: newNotifs };
      });
      onClose();
    }
  };

  if (pickingImage) {
    return (
      <div className="absolute inset-0 z-50 bg-[#12111d]">
        <ImagePicker store={store} commit={commit} initialTab="gallery" onCancel={() => setPickingImage(false)} onSelect={(res) => { 
          let galleryId = undefined;
          if (res.source === 'gallery' && res.imageId) {
            const match = store.gallery?.find(g => g.imageId === res.imageId);
            if (match) galleryId = match.id;
          } else if (res.source === 'gallery' && res.dataUrl) {
            const match = store.gallery?.find(g => g.dataUrl === res.dataUrl);
            if (match) galleryId = match.id;
          }
          commit((s: PhoneStore) => ({ ...s, echoPosts: s.echoPosts.map(p => p.id === postId ? { ...p, imageId: res.imageId, dataUrl: res.dataUrl, galleryId } : p) }));
          setPickingImage(false); 
        }} />
      </div>
    );
  }

  let editImageUrl = post.imageId ? `/api/story/image/${post.imageId}` : post.dataUrl;
  if (!editImageUrl && post.galleryId) {
    const gItem = store.gallery?.find(g => g.id === post.galleryId);
    if (gItem) editImageUrl = gItem.imageId ? `/api/story/image/${gItem.imageId}` : gItem.dataUrl;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
          <h2 className="font-medium">Edit Post</h2>
        </div>
        <button onClick={save} className="text-[#a293b6] text-sm">Save</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-4 text-sm pb-10">
        <div>
          <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Author</label>
          <select value={authorContactId || ''} onChange={e => setAuthorContactId(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none">
            <option value="">Keep Original ({post.author})</option>
            <option value="ME">Hyunjin (Me)</option>
            {store.contacts.map(c => <option key={c.id} value={c.id}>{echoContactName(c, c.name)}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Content</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[100px]" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Time Display</label>
            <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Likes</label>
            <input type="number" value={likes} onChange={e => setLikes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Reposts</label>
            <input type="number" value={reposts} onChange={e => setReposts(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Replies</label>
            <input type="number" value={replies} onChange={e => setReplies(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
        </div>
        <div className="pt-2">
          <button onClick={() => setPickingImage(true)} className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-[#a293b6] flex items-center justify-center gap-2">
            <ImageIcon size={16} /> {editImageUrl ? 'Change Image' : 'Add Image'}
          </button>
          {editImageUrl && (
            <button onClick={() => commit((s: PhoneStore) => ({ ...s, echoPosts: s.echoPosts.map(p => p.id === postId ? { ...p, imageId: undefined, dataUrl: undefined, galleryId: undefined } : p) }))} className="w-full mt-2 py-3 rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 text-xs flex items-center justify-center gap-2">Remove Image</button>
          )}
        </div>
        <div className="pt-6 border-t border-white/10 mt-6">
          <button onClick={deletePost} className="w-full py-3 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center gap-2"><Trash2 size={16} /> Delete Post</button>
        </div>
      </div>
    </div>
  );
}

function EditProfileView({ store, commit, onClose }: { store: PhoneStore, commit: any, onClose: () => void }) {
  const [displayName, setDisplayName] = useState(store.echoProfile.displayName);
  const [username, setUsername] = useState(store.echoProfile.username);
  const [bio, setBio] = useState(store.echoProfile.bio);

  const [handles, setHandles] = useState(store.echoAccountHandles || {});

  const save = () => {
    commit((s: PhoneStore) => ({
      ...s,
      echoProfile: { displayName, username, bio },
      echoAccountHandles: handles
    }));
    onClose();
  };

  return (
    <div className="flex h-full flex-col">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="text-white/50 hover:text-white"><ArrowLeft size={20} /></button>
          <h2 className="font-medium">Edit Profile & Accounts</h2>
        </div>
        <button onClick={save} className="text-[#a293b6] text-sm">Save</button>
      </div>
      <div className="flex-1 overflow-y-auto space-y-6 text-sm pb-10">
        <div className="space-y-4">
          <SectionTitle>Hyunjin (Me)</SectionTitle>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Display Name</label>
            <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-white/50 uppercase tracking-widest mb-1 block">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none min-h-[80px]" />
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/10">
          <SectionTitle>Other Accounts</SectionTitle>
          <p className="text-[10px] text-white/50 mb-2">Override Echo usernames for your contacts.</p>
          {store.contacts.map(c => (
            <div key={c.id} className="flex items-center gap-3">
              <Avatar initials={c.initials} color={c.color} size="sm" />
              <div className="flex-1">
                <span className="text-xs">{echoContactName(c, c.name)}</span>
                <input type="text" value={handles[c.id] || ''} onChange={e => setHandles({ ...handles, [c.id]: e.target.value })} placeholder={`@${echoContactName(c, c.name).toLowerCase().replace(/\s+/g,'')}`} className="w-full mt-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white outline-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}