import React, { useMemo, useRef, useState } from 'react';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import './FarmerFarmBlogPage.css';

const orange = '#F4A261';
const green = '#2D6A4F';

function formatRelativeDate(inputDate) {
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) return '';
  if (diffDays <= 0) return 'today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

function getMediaTypeBadge(post) {
  if (post.type === 'video') return { label: '🎥 Video', className: 'ffb-badge ffba-video' };
  return { label: '📷 Image', className: 'ffb-badge ffba-image' };
}

function isVideoFile(file) {
  return (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
}

export default function FarmerFarmBlogPage() {
  const fileInputRef = useRef(null);

  const [posts, setPosts] = useState(() => {
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

    return [
      {
        id: 'post-1',
        type: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1000&q=70',
        caption: 'Harvesting fresh tomatoes today! The greenhouse is thriving 🌿',
        createdAt: daysAgo(2),
      },
      {
        id: 'post-2',
        type: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1560493676-04071c5f467b?auto=format&fit=crop&w=1000&q=70',
        caption: 'New pepper plants growing well—looking forward to the next harvest.',
        createdAt: daysAgo(5),
      },
      {
        id: 'post-3',
        type: 'video',
        mediaUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
        caption: 'Quick farm update: watering schedule and plant health check.',
        createdAt: daysAgo(9),
      },
      {
        id: 'post-4',
        type: 'image',
        mediaUrl:
          'https://images.unsplash.com/photo-1595374882832-21b3efda5f9c?auto=format&fit=crop&w=1000&q=70',
        caption: 'Maize field looking great—soil moisture is perfect after the rains.',
        createdAt: daysAgo(13),
      },
    ];
  });

  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const thisMonthCount = posts.filter((p) => {
      const d = new Date(p.createdAt);
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    }).length;

    const images = posts.filter((p) => p.type === 'image').length;
    const videos = posts.filter((p) => p.type === 'video').length;

    return {
      totalPosts,
      thisMonthCount,
      images,
      videos,
    };
  }, [posts]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draftCaption, setDraftCaption] = useState('');
  const [draftFile, setDraftFile] = useState(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState(null);
  const [draftType, setDraftType] = useState('image');

  const openNewPost = () => {
    setIsModalOpen(true);
    setDraftCaption('');
    setDraftFile(null);
    setDraftPreviewUrl(null);
    setDraftType('image');
    // keep ref reset for new selection
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const onPickFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (draftPreviewUrl && draftPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(draftPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    const isVid = isVideoFile(file);
    setDraftFile(file);
    setDraftPreviewUrl(preview);
    setDraftType(isVid ? 'video' : 'image');
  };

  const submitPost = () => {
    if (!draftFile) return;

    const newPost = {
      id: `post-${Date.now()}`,
      type: draftType,
      mediaUrl: draftPreviewUrl,
      caption: draftCaption.trim(),
      createdAt: new Date().toISOString(),
    };

    setPosts((prev) => [newPost, ...prev]);
    setIsModalOpen(false);
  };

  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const openDeleteConfirm = (id) => {
    setConfirmDeleteId(id);
  };

  const closeDeleteConfirm = () => {
    setConfirmDeleteId(null);
  };

  const confirmDelete = () => {
    if (!confirmDeleteId) return;
    setPosts((prev) => prev.filter((p) => p.id !== confirmDeleteId));
    setConfirmDeleteId(null);
  };

  return (
    <div className="ffb-page">
      {/* Header */}
      <div className="ffb-header">
        <div>
          <h2 className="ffb-title">My Farm Blog</h2>
          <p className="ffb-subtitle">Share your daily farm activity with buyers</p>
        </div>
        <button type="button" className="ffb-newpost" onClick={openNewPost}>
          <Plus size={16} /> + New Post
        </button>
      </div>

      {/* Stats */}
      <div className="ffb-stats-row">
        <div className="ffb-stat">
          <div className="ffb-stat-label">Total Posts</div>
          <div className="ffb-stat-value">{stats.totalPosts}</div>
        </div>
        <div className="ffb-stat">
          <div className="ffb-stat-label">This Month</div>
          <div className="ffb-stat-value">{stats.thisMonthCount}</div>
        </div>
        <div className="ffb-stat">
          <div className="ffb-stat-label">Images</div>
          <div className="ffb-stat-value">{stats.images}</div>
        </div>
        <div className="ffb-stat">
          <div className="ffb-stat-label">Videos</div>
          <div className="ffb-stat-value">{stats.videos}</div>
        </div>
      </div>

      {/* Content */}
      {posts.length > 0 ? (
        <div className="ffb-grid">
          {posts.map((post) => {
            const badge = getMediaTypeBadge(post);

            return (
              <div key={post.id} className="ffb-card">
                <div className="ffb-media">
                  {post.type === 'image' ? (
                    <img className="ffb-media-img" src={post.mediaUrl} alt={post.caption || 'Farm media'} />
                  ) : (
                    <video
                      className="ffb-media-video"
                      src={post.mediaUrl}
                      controls
                      preload="metadata"
                    />
                  )}
                  <div className={badge.className}>
                    {badge.label}
                  </div>
                </div>

                <div className="ffb-card-body">
                  <p className="ffb-caption">{post.caption}</p>
                  <div className="ffb-date">{formatRelativeDate(post.createdAt)}</div>
                </div>

                <div className="ffb-card-actions">
                  <button
                    type="button"
                    className="ffb-delete"
                    onClick={() => openDeleteConfirm(post.id)}
                    aria-label="Delete post"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ffb-empty">
          <div className="ffb-empty-icon">
            <ImageIcon size={44} />
          </div>
          <h3>You haven't posted anything yet</h3>
          <p>Share your first farm update</p>
          <button type="button" className="ffb-empty-btn" onClick={openNewPost}>
            + New Post
          </button>
        </div>
      )}

      {/* New Post Modal */}
      {isModalOpen && (
        <div className="ffb-modal-overlay" onClick={closeModal}>
          <div className="ffb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ffb-modal-header">
              <div>
                <div className="ffb-modal-title">Create a Post</div>
                <div className="ffb-modal-subtitle">Upload an image or video from your farm</div>
              </div>
              <button type="button" className="ffb-modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="ffb-modal-body">
              <div className="ffb-upload">
                <label className="ffb-upload-label">
                  Upload image or video
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    className="ffb-upload-input"
                    onChange={onPickFile}
                  />
                </label>

                <div className="ffb-preview-wrap">
                  {draftPreviewUrl ? (
                    draftType === 'video' ? (
                      <video className="ffb-preview-video" src={draftPreviewUrl} controls />
                    ) : (
                      <img className="ffb-preview-img" src={draftPreviewUrl} alt="Preview" />
                    )
                  ) : (
                    <div className="ffb-preview-empty">No media selected</div>
                  )}
                </div>
              </div>

              <div className="ffb-form-group">
                <label className="ffb-label">Caption</label>
                <textarea
                  className="ffb-textarea"
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  rows={4}
                  placeholder="Write a short update for buyers..."
                />
              </div>
            </div>

            <div className="ffb-modal-footer">
              <button type="button" className="ffb-btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="ffb-btn-primary"
                onClick={submitPost}
                disabled={!draftFile}
                style={!draftFile ? { opacity: 0.6, cursor: 'not-allowed' } : undefined}
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="ffb-modal-overlay" onClick={closeDeleteConfirm}>
          <div className="ffb-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="ffb-confirm-title">Are you sure you want to delete this post?</div>
            <div className="ffb-confirm-actions">
              <button type="button" className="ffb-btn-secondary" onClick={closeDeleteConfirm}>
                Cancel
              </button>
              <button type="button" className="ffb-btn-danger" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Theme constants (avoid unused warnings in some tooling) */}
      <div style={{ display: 'none' }}>{orange}{green}</div>
    </div>
  );
}

