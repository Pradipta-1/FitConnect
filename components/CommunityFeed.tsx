"use client";

import React, { useEffect, useState, useRef } from "react";
import { apiFetch } from "@/lib/apiFetch";
import ProfileModal from "./ProfileModal";

type Comment = {
  id: string;
  content: string;
  imageUrl: string | null;
  parentId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
};

type Post = {
  id: string;
  content: string | null;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatarUrl: string | null;
    role: string;
  };
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
};

export default function CommunityFeed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [isCommenting, setIsCommenting] = useState<Record<string, boolean>>({});
  const [replyingTo, setReplyingTo] = useState<Record<string, string | null>>({});
  const [commentFile, setCommentFile] = useState<Record<string, File | null>>({});
  const [commentPreview, setCommentPreview] = useState<Record<string, string | null>>({});
  const [currentUser, setCurrentUser] = useState<{ id: string, role: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ 
    isOpen: boolean; 
    title: string; 
    message: string; 
    onConfirm: () => void;
    type?: "danger" | "warning";
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [profileUserId, setProfileUserId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const commentFileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchCurrentUser();
    fetchPosts();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch current user:", err);
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await apiFetch("/api/posts");
      const data = await res.json();
      if (data.success) {
        setPosts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const res = await apiFetch(`/api/posts/${postId}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            return {
              ...p,
              isLikedByMe: data.liked,
              likesCount: data.liked ? p.likesCount + 1 : p.likesCount - 1
            };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error("Failed to toggle like:", err);
    }
  };

  const toggleComments = async (postId: string) => {
    const isExpanded = expandedComments[postId];
    setExpandedComments(prev => ({ ...prev, [postId]: !isExpanded }));

    if (!isExpanded && !commentsByPost[postId]) {
      fetchComments(postId);
    }
  };

  const fetchComments = async (postId: string) => {
    setLoadingComments(prev => ({ ...prev, [postId]: true }));
    try {
      const res = await apiFetch(`/api/posts/${postId}/comments`);
      const data = await res.json();
      if (data.success) {
        setCommentsByPost(prev => ({ ...prev, [postId]: data.data }));
      }
    } catch (err) {
      console.error("Failed to fetch comments:", err);
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = (postId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Post",
      message: "Are you sure you want to delete this post? This action cannot be undone and all comments will be removed.",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/posts/${postId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
          }
        } catch (err) {
          console.error("Failed to delete post:", err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteComment = (postId: string, commentId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Comment",
      message: "Are you sure you want to delete this comment? Replies to this comment will also be removed.",
      type: "danger",
      onConfirm: async () => {
        try {
          const res = await apiFetch(`/api/comments/${commentId}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            setCommentsByPost(prev => ({
              ...prev,
              [postId]: prev[postId].filter(c => c.id !== commentId)
            }));
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p
            ));
          }
        } catch (err) {
          console.error("Failed to delete comment:", err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handlePaste = (e: React.ClipboardEvent, postId?: string) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          if (postId) {
            // Comment input paste
            setCommentFile(prev => ({ ...prev, [postId]: file }));
            const url = URL.createObjectURL(file);
            setCommentPreview(prev => ({ ...prev, [postId]: url }));
          } else {
            // Main post input paste
            setSelectedFile(file);
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
          }
        }
      }
    }
  };

  const handleAddComment = async (e: React.FormEvent, postId: string) => {
    e.preventDefault();
    const commentText = newComment[postId]?.trim();
    const parentId = replyingTo[postId];
    const file = commentFile[postId];
    
    if (!commentText && !file) return;

    setIsCommenting(prev => ({ ...prev, [postId]: true }));
    try {
      let uploadedImageUrl = null;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const upRes = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          uploadedImageUrl = upData.url;
        }
      }

      const res = await apiFetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: commentText || "", 
          parentId, 
          imageUrl: uploadedImageUrl 
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCommentsByPost(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), data.data]
        }));
        setNewComment(prev => ({ ...prev, [postId]: "" }));
        setReplyingTo(prev => ({ ...prev, [postId]: null }));
        setCommentFile(prev => ({ ...prev, [postId]: null }));
        setCommentPreview(prev => ({ ...prev, [postId]: null }));
        setPosts(prev => prev.map(p => 
          p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p
        ));
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setIsCommenting(prev => ({ ...prev, [postId]: false }));
    }
  };

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>, postId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      setCommentFile(prev => ({ ...prev, [postId]: file }));
      const url = URL.createObjectURL(file);
      setCommentPreview(prev => ({ ...prev, [postId]: url }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedFile) return;

    setSubmitting(true);
    setError(null);

    let uploadedImageUrl = null;

    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        const upRes = await apiFetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const upData = await upRes.json();
        if (upRes.ok && upData.url) {
          uploadedImageUrl = upData.url;
        } else {
          throw new Error("Failed to upload image");
        }
      }

      const res = await apiFetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          imageUrl: uploadedImageUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newPostWithCounts = {
          ...data.data,
          likesCount: 0,
          commentsCount: 0,
          isLikedByMe: false
        };
        setPosts([newPostWithCounts, ...posts]);
        setContent("");
        setSelectedFile(null);
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        throw new Error(data.error || "Failed to create post");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const CommentItem = ({ comment, postId, depth = 0 }: { comment: Comment, postId: string, depth?: number }) => {
    const replies = commentsByPost[postId]?.filter(c => c.parentId === comment.id) || [];
    
    return (
      <div className={`flex flex-col gap-2 ${depth > 0 ? "ml-8 border-l-2 border-emerald-500/20 pl-4" : ""}`}>
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-[#121c17] flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-emerald-400 ring-1 ring-emerald-500/20">
            {comment.user.avatarUrl ? (
              <img src={comment.user.avatarUrl} alt={comment.user.name} className="w-full h-full object-cover rounded-full" />
            ) : (
              comment.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex-1 bg-[#0d1411] rounded-xl p-3 border border-emerald-500/15">
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    onClick={() => setProfileUserId(comment.user.id)}
                    className="text-sm font-bold text-white hover:text-emerald-400 hover:underline transition-all"
                  >
                    {comment.user.name}
                  </button>
                  <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest px-1.5 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                    {comment.user.role}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-slate-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            {comment.content && <p className="text-sm text-slate-300 mb-2">{comment.content}</p>}
            {comment.imageUrl && (
              <div className="mb-2 max-w-xs rounded-lg overflow-hidden border border-emerald-500/20">
                <img
                  src={comment.imageUrl}
                  alt="Comment image"
                  className="w-full h-auto cursor-pointer hover:opacity-90 grayscale-[0.3] hover:grayscale-0 transition-all"
                  onClick={() => setEnlargedImage(comment.imageUrl)}
                />
              </div>
            )}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setReplyingTo(prev => ({ ...prev, [postId]: comment.id }))}
                className="text-[10px] font-bold text-slate-400 hover:text-emerald-400 transition-colors uppercase tracking-widest"
              >
                Reply
              </button>
              {(currentUser?.id === comment.user.id || currentUser?.role === "ADMIN") && (
                <button
                  onClick={() => handleDeleteComment(postId, comment.id)}
                  className="text-[10px] font-bold text-slate-500 hover:text-red-400 transition-colors uppercase tracking-widest"
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Child Replies */}
        {replies.length > 0 && (
          <div className="space-y-4 mt-2">
            {replies.map(reply => (
              <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Create Post Card */}
      <div className="card p-4 sm:p-5 border border-emerald-500/20 bg-[#090e0c]/90 backdrop-blur-xl rounded-2xl shadow-xl">
        <h2 className="text-base sm:text-lg font-bold text-white mb-3">Share with the Community</h2>
        <form onSubmit={handleCreatePost} className="space-y-3">
          <textarea
            className="w-full bg-[#0d1411] border border-emerald-500/20 rounded-xl p-3 text-sm text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all resize-none h-20 sm:h-24 placeholder:text-slate-500"
            placeholder="What's on your mind? Share your progress, tips, or just say hi! (Paste images directly here)"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onPaste={(e) => handlePaste(e)}
          />

          {previewUrl && (
            <div className="relative rounded-xl overflow-hidden border border-emerald-500/20">
              <img src={previewUrl} alt="Preview" className="w-full h-auto max-h-96 object-cover" />
              <button
                type="button"
                className="absolute top-2 right-2 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                onClick={() => {
                  setSelectedFile(null);
                  setPreviewUrl(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button
              type="button"
              className="flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium">Add Photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileChange}
            />

            <button
              type="submit"
              disabled={submitting || (!content.trim() && !selectedFile)}
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#121c17] disabled:text-slate-600 text-black font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
            >
              {submitting ? "Posting..." : "Post"}
            </button>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>
      </div>

      {/* Posts Feed */}
      <div className="space-y-6 pb-20">
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-emerald-500 border-t-transparent" />
            <p className="mt-4 text-slate-400">Loading community posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 bg-[#090e0c]/90 border border-emerald-500/15 rounded-2xl">
            <p className="text-slate-400">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="card bg-[#090e0c]/90 border border-emerald-500/15 rounded-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 shadow-xl">
              {/* Post Header */}
              <div className="p-4 flex items-center gap-3 border-b border-emerald-500/10">
                <div
                  className="w-10 h-10 rounded-full bg-[#121c17] border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold overflow-hidden ring-2 ring-emerald-500/20 cursor-pointer flex-shrink-0"
                  onClick={() => post.user.avatarUrl && setEnlargedImage(post.user.avatarUrl)}
                >
                  {post.user.avatarUrl ? (
                    <img src={post.user.avatarUrl} alt={post.user.name} className="w-full h-full object-cover hover:opacity-80 transition-opacity" />
                  ) : (
                    post.user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => setProfileUserId(post.user.id)}
                    className="text-white font-bold hover:text-emerald-400 hover:underline transition-all text-left block"
                  >
                    {post.user.name}
                  </button>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase font-bold tracking-wider">
                      {post.user.role}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                {(currentUser?.id === post.user.id || currentUser?.role === "ADMIN") && (
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className="ml-auto p-2 text-slate-500 hover:text-red-400 transition-colors"
                    title="Delete post"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Post Content */}
              {post.content && (
                <div className="p-4 text-slate-200 leading-relaxed">
                  {post.content}
                </div>
              )}

              {/* Post Image */}
              {post.imageUrl && (
                <div className="relative w-full aspect-square md:aspect-video bg-[#050806]">
                  <img
                    src={post.imageUrl}
                    alt="Post image"
                    className="absolute inset-0 w-full h-full object-contain md:object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setEnlargedImage(post.imageUrl)}
                  />
                </div>
              )}

              {/* Post Footer */}
              <div className="px-4 py-3 flex items-center gap-6 border-t border-emerald-500/10">
                <button 
                  onClick={() => handleLike(post.id)}
                  className={`flex items-center gap-2 transition-colors group ${post.isLikedByMe ? "text-red-400" : "text-slate-400 hover:text-red-400"}`}
                >
                  <svg className={`w-6 h-6 ${post.isLikedByMe ? "fill-red-400" : "group-hover:fill-red-400/20"}`} fill={post.isLikedByMe ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className="text-sm font-medium">{post.likesCount > 0 ? post.likesCount : "Like"}</span>
                </button>
                <button 
                  onClick={() => toggleComments(post.id)}
                  className={`flex items-center gap-2 transition-colors group ${expandedComments[post.id] ? "text-emerald-400" : "text-slate-400 hover:text-emerald-400"}`}
                >
                  <svg className={`w-6 h-6 ${expandedComments[post.id] ? "fill-emerald-400/20" : "group-hover:fill-emerald-400/20"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.855-1.246L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="text-sm font-medium">{post.commentsCount > 0 ? post.commentsCount : "Comment"}</span>
                </button>
              </div>

              {/* Comments Section */}
              {expandedComments[post.id] && (
                <div className="bg-[#060907]/90 border-t border-emerald-500/10 p-4 space-y-4">
                  {/* Comment List */}
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {loadingComments[post.id] ? (
                      <div className="py-4 text-center">
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" />
                      </div>
                    ) : commentsByPost[post.id]?.length === 0 ? (
                      <p className="text-slate-500 text-sm italic py-2">No comments yet.</p>
                    ) : (
                      commentsByPost[post.id]
                        ?.filter(c => !c.parentId)
                        .map(comment => (
                          <CommentItem key={comment.id} comment={comment} postId={post.id} />
                        ))
                    )}
                  </div>

                  {/* Add Comment */}
                  <div className="pt-4 border-t border-emerald-500/10">
                    {replyingTo[post.id] && (
                      <div className="flex items-center justify-between mb-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                        <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                          Replying to {commentsByPost[post.id]?.find(c => c.id === replyingTo[post.id])?.user.name}
                        </span>
                        <button 
                          onClick={() => setReplyingTo(prev => ({ ...prev, [post.id]: null }))}
                          className="text-slate-400 hover:text-white"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                    
                    <form onSubmit={(e) => handleAddComment(e, post.id)} className="space-y-3">
                      {commentPreview[post.id] && (
                        <div className="relative inline-block rounded-lg overflow-hidden border border-emerald-500/20">
                          <img src={commentPreview[post.id]!} alt="Preview" className="max-h-32 w-auto" />
                          <button
                            type="button"
                            className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full hover:bg-black/80 transition-colors"
                            onClick={() => {
                              setCommentFile(prev => ({ ...prev, [post.id]: null }));
                              setCommentPreview(prev => ({ ...prev, [post.id]: null }));
                              if (commentFileInputRefs.current[post.id]) commentFileInputRefs.current[post.id]!.value = "";
                            }}
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                          onClick={() => commentFileInputRefs.current[post.id]?.click()}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </button>
                        <input
                          type="file"
                          ref={(el) => { commentFileInputRefs.current[post.id] = el; }}
                          className="hidden"
                          accept="image/*"
                          onChange={(e) => handleCommentFileChange(e, post.id)}
                        />
                        <input
                          type="text"
                          placeholder={replyingTo[post.id] ? "Write a reply... (Paste images supported)" : "Add a comment... (Paste images supported)"}
                          value={newComment[post.id] || ""}
                          onChange={(e) => setNewComment(prev => ({ ...prev, [post.id]: e.target.value }))}
                          onPaste={(e) => handlePaste(e, post.id)}
                          className="flex-1 bg-[#0d1411] border border-emerald-500/20 rounded-lg px-3 py-1.5 text-sm text-white focus:border-emerald-500 outline-none placeholder:text-slate-500"
                        />
                        <button
                          type="submit"
                          disabled={isCommenting[post.id] || (!newComment[post.id]?.trim() && !commentFile[post.id])}
                          className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-[#121c17] disabled:text-slate-600 text-black text-sm font-bold rounded-lg transition-all"
                        >
                          {isCommenting[post.id] ? "..." : (replyingTo[post.id] ? "Reply" : "Post")}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setEnlargedImage(null)}
        >
          <div 
            className="relative max-w-5xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-[#121c17] text-white hover:bg-[#1a2821] transition-colors focus:outline-none ring-1 border border-emerald-500/20"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <img 
              src={enlargedImage!} 
              alt="Enlarged image" 
              className="w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
          />
          <div className="relative w-full max-w-sm bg-[#090e0c] border border-emerald-500/20 rounded-3xl p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
            <div className={`w-16 h-16 rounded-2xl ${confirmDialog.type === "danger" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"} flex items-center justify-center mb-6`}>
              {confirmDialog.type === "danger" ? (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">{confirmDialog.title}</h3>
            <p className="text-slate-400 mb-8 leading-relaxed">{confirmDialog.message}</p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmDialog.onConfirm}
                className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg ${
                  confirmDialog.type === "danger" 
                    ? "bg-red-500 hover:bg-red-600 shadow-red-500/20 text-white" 
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20 text-white"
                }`}
              >
                {confirmDialog.type === "danger" ? "Delete it" : "Confirm"}
              </button>
              <button
                onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-4 bg-[#121c17] hover:bg-[#1a2821] text-white border border-emerald-500/20 font-bold rounded-2xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .card {
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .card:hover {
          transform: translateY(-2px);
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #222c27;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #00c896;
        }
      `}</style>
      {profileUserId && (
        <ProfileModal userId={profileUserId} onClose={() => setProfileUserId(null)} />
      )}
    </div>
  );
}
