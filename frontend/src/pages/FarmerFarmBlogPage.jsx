import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Pencil, Image as ImageIcon, Video, Loader, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  fetchFarmerPosts,
  createFarmPost,
  updateFarmPost,
  deleteFarmPost,
  fileToDataUrl
} from '../services/farmBlogService';
import './FarmerFarmBlogPage.css';

const cropCategories = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Legumes'];

function formatRelativeDate(inputDate) {
  if (!inputDate) return 'Today';
  const date = inputDate instanceof Date ? inputDate : new Date(inputDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (Number.isNaN(diffDays)) return 'Recently';
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 30) return `${diffDays} days ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths <= 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

function getMediaTypeBadge(post) {
  if (post.type === 'video' || post.media_type === 'video') return { label: 'Video', className: 'ffb-badge ffba-video' };
  return { label: 'Image', className: 'ffb-badge ffba-image' };
}

function isVideoFile(file) {
  return (file.type && file.type.startsWith('video/')) || /\.(mp4|webm|ogg|mov)$/i.test(file.name);
}

export default function FarmerFarmBlogPage() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [notification, setNotification] = useState('');

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null); // null if creating, post object if editing

  // Form states
  const [draftCaption, setDraftCaption] = useState('');
  const [draftCropType, setDraftCropType] = useState('vegetables');
  const [draftFile, setDraftFile] = useState(null);
  const [draftPreviewUrl, setDraftPreviewUrl] = useState(null);
  const [draftType, setDraftType] = useState('image');

  // Confirmation modal
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Load posts for logged-in farmer
  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const farmerId = user?.id || 'demo-farmer-id';
      const farmerPosts = await fetchFarmerPosts(farmerId);
      setPosts(farmerPosts);
    } catch (err) {
      console.error('Error loading farmer posts:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  // Show temporary toast notification
  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3000);
  };

  // Stats calculation
  const stats = useMemo(() => {
    const totalPosts = posts.length;
    const thisMonthCount = posts.filter((p) => {
      const d = new Date(p.createdAt || p.created_at);
      const n = new Date();
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth();
    }).length;

    const images = posts.filter((p) => (p.type || p.media_type) === 'image').length;
    const videos = posts.filter((p) => (p.type || p.media_type) === 'video').length;

    return { totalPosts, thisMonthCount, images, videos };
  }, [posts]);

  // Open Create New Post Modal
  const openNewPost = () => {
    setEditingPost(null);
    setDraftCaption('');
    setDraftCropType('vegetables');
    setDraftFile(null);
    setDraftPreviewUrl(null);
    setDraftType('image');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setIsModalOpen(true);
  };

  // Open Edit Existing Post Modal
  const openEditPost = (post) => {
    setEditingPost(post);
    setDraftCaption(post.caption || '');
    setDraftCropType(post.cropType || post.crop_type || 'vegetables');
    setDraftFile(null);
    setDraftPreviewUrl(post.mediaUrl || post.media_url);
    setDraftType(post.type || post.media_type || 'image');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPost(null);
  };

  // Handle File Selection (Images & Videos)
  const onPickFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const isVid = isVideoFile(file);
    setDraftFile(file);
    setDraftType(isVid ? 'video' : 'image');

    // Generate preview / data URL
    if (isVid) {
      const vidUrl = URL.createObjectURL(file);
      setDraftPreviewUrl(vidUrl);
    } else {
      const dataUrl = await fileToDataUrl(file);
      setDraftPreviewUrl(dataUrl);
    }
  };

  // Submit New or Updated Post
  const submitPost = async () => {
    if (!draftPreviewUrl && !draftFile) return;

    setSaveLoading(true);
    try {
      let finalMediaUrl = draftPreviewUrl;

      if (draftFile) {
        if (draftType === 'image') {
          finalMediaUrl = await fileToDataUrl(draftFile);
        } else {
          // For video file, convert to FileReader Data URL
          finalMediaUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.onerror = () => resolve(draftPreviewUrl);
            reader.readAsDataURL(draftFile);
          });
        }
      }

      const farmerDetails = {
        id: user?.id || 'farmer-1',
        name: user?.name || 'Farmer',
        farmName: user?.profileDetails?.farm_name || user?.name || 'AgriLink Farm',
        location: user?.profileDetails?.farm_location || user?.location || 'Kumasi, Ghana',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80'
      };

      if (editingPost) {
        // UPDATE EXISTING POST
        await updateFarmPost(editingPost.id, {
          caption: draftCaption.trim(),
          cropType: draftCropType.toLowerCase(),
          mediaUrl: finalMediaUrl,
          mediaType: draftType
        });
        showToast('Post updated successfully!');
      } else {
        // CREATE NEW POST
        await createFarmPost({
          farmerId: user?.id || 'farmer-1',
          mediaType: draftType,
          mediaUrl: finalMediaUrl,
          caption: draftCaption.trim(),
          cropType: draftCropType.toLowerCase(),
          farmerDetails
        });
        showToast('New post published to AgriLink Farm Feed!');
      }

      await loadPosts();
      closeModal();
    } catch (err) {
      console.error('Error submitting post:', err);
      showToast('Failed to save post. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // Delete Post Execution
  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setSaveLoading(true);
    try {
      await deleteFarmPost(confirmDeleteId);
      showToast('Post deleted.');
      await loadPosts();
    } catch (err) {
      console.error('Error deleting post:', err);
    } finally {
      setSaveLoading(false);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="ffb-page">
      {/* Toast Notification */}
      {notification && (
        <div className="ffb-toast">
          <Check size={16} /> {notification}
        </div>
      )}

      {/* Header */}
      <div className="ffb-header">
        <div>
          <h2 className="ffb-title">My Realtime Farm Blog</h2>
          <p className="ffb-subtitle">Share real photo & video updates from your farm with AgriLink buyers</p>
        </div>
        <div className="ffb-header-actions">
          <button type="button" className="ffb-refresh-btn" onClick={loadPosts} title="Refresh posts">
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
          </button>
          <button type="button" className="ffb-newpost" onClick={openNewPost}>
            <Plus size={16} /> + New Post
          </button>
        </div>
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

      {/* Posts List */}
      {loading ? (
        <div className="ffb-loading-state">
          <Loader size={36} className="spin" color="#2D6A4F" />
          <p>Loading your farm posts...</p>
        </div>
      ) : posts.length > 0 ? (
        <div className="ffb-grid">
          {posts.map((post) => {
            const badge = getMediaTypeBadge(post);
            const mediaSrc = post.mediaUrl || post.media_url;
            const isVid = (post.type || post.media_type) === 'video';

            return (
              <div key={post.id} className="ffb-card">
                <div className="ffb-media">
                  {isVid ? (
                    <video
                      className="ffb-media-video"
                      src={mediaSrc}
                      controls
                      preload="metadata"
                    />
                  ) : (
                    <img className="ffb-media-img" src={mediaSrc} alt={post.caption || 'Farm post'} />
                  )}
                  <div className={badge.className}>
                    {badge.label}
                  </div>
                  <span className="ffb-crop-tag">
                    {post.cropType || post.crop_type || 'Crop'}
                  </span>
                </div>

                <div className="ffb-card-body">
                  <p className="ffb-caption">{post.caption || 'No caption'}</p>
                  <div className="ffb-date">{formatRelativeDate(post.createdAt || post.created_at)}</div>
                </div>

                <div className="ffb-card-actions">
                  <button
                    type="button"
                    className="ffb-btn-icon edit"
                    onClick={() => openEditPost(post)}
                    title="Edit post"
                  >
                    <Pencil size={16} /> Edit
                  </button>
                  <button
                    type="button"
                    className="ffb-btn-icon delete"
                    onClick={() => setConfirmDeleteId(post.id)}
                    title="Delete post"
                  >
                    <Trash2 size={16} /> Delete
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
          <h3>You haven't posted any farm updates yet</h3>
          <p>Upload your first real photo or video from your farm to reach buyers</p>
          <button type="button" className="ffb-empty-btn" onClick={openNewPost}>
            + New Post
          </button>
        </div>
      )}

      {/* New / Edit Post Modal */}
      {isModalOpen && (
        <div className="ffb-modal-overlay" onClick={closeModal}>
          <div className="ffb-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ffb-modal-header">
              <div>
                <div className="ffb-modal-title">
                  {editingPost ? 'Edit Farm Post' : 'Create Realtime Post'}
                </div>
                <div className="ffb-modal-subtitle">
                  Upload an authentic photo or video from your farm
                </div>
              </div>
              <button type="button" className="ffb-modal-close" onClick={closeModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="ffb-modal-body">
              {/* Media Selection / Upload */}
              <div className="ffb-upload">
                <label className="ffb-upload-label">
                  Select Image or Video File
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
                      <video className="ffb-preview-video" src={draftPreviewUrl} controls autoPlay muted />
                    ) : (
                      <img className="ffb-preview-img" src={draftPreviewUrl} alt="Preview" />
                    )
                  ) : (
                    <div className="ffb-preview-empty">No file selected yet</div>
                  )}
                </div>
              </div>

              {/* Crop Category Selection */}
              <div className="ffb-form-group">
                <label className="ffb-label">Crop Category *</label>
                <select
                  className="ffb-select"
                  value={draftCropType}
                  onChange={(e) => setDraftCropType(e.target.value)}
                >
                  {cropCategories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Caption Textarea */}
              <div className="ffb-form-group">
                <label className="ffb-label">Caption *</label>
                <textarea
                  className="ffb-textarea"
                  value={draftCaption}
                  onChange={(e) => setDraftCaption(e.target.value)}
                  rows={4}
                  placeholder="Share details about your harvest, crop health, or delivery date with buyers..."
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
                disabled={saveLoading || (!draftPreviewUrl && !draftFile)}
              >
                {saveLoading ? 'Publishing...' : editingPost ? 'Save Changes' : 'Publish Post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDeleteId && (
        <div className="ffb-modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="ffb-confirm" onClick={(e) => e.stopPropagation()}>
            <div className="ffb-confirm-title">Are you sure you want to delete this post?</div>
            <div className="ffb-confirm-subtitle">This will remove the post from buyer feed in real time.</div>
            <div className="ffb-confirm-actions">
              <button type="button" className="ffb-btn-secondary" onClick={() => setConfirmDeleteId(null)}>
                Cancel
              </button>
              <button type="button" className="ffb-btn-danger" onClick={confirmDelete} disabled={saveLoading}>
                {saveLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
