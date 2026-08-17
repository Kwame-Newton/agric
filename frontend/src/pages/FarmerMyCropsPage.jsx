import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './FarmerMyCropsPage.css';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  PauseCircle,
  PlayCircle,
  Image as ImageIcon,
  X,
  Loader,
  RefreshCw,
} from 'lucide-react';

const cropCategories = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Spices'];
const cropStatuses = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

function StatusBadge({ status }) {
  const map = {
    active:       { label: 'Active',        className: 'fm-badge fm-badge-active' },
    paused:       { label: 'Paused',        className: 'fm-badge fm-badge-paused' },
    out_of_stock: { label: 'Out of Stock',  className: 'fm-badge fm-badge-oos'    },
  };
  const info = map[status] || { label: status, className: 'fm-badge' };
  return <span className={info.className}>{info.label}</span>;
}

function getDerivedStatus(quantity, status) {
  if (Number(quantity) <= 0) return 'out_of_stock';
  return status;
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

const FALLBACK_IMAGES = {
  Vegetables: 'https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?auto=format&fit=crop&w=300&q=70',
  Fruits:     'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=300&q=70',
  Grains:     'https://images.unsplash.com/photo-1577449923886-df3d846797af?auto=format&fit=crop&w=300&q=70',
  Tubers:     'https://images.unsplash.com/photo-1524592412331-4fe04e37381d?auto=format&fit=crop&w=300&q=70',
  Spices:     'https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?auto=format&fit=crop&w=300&q=70',
};

// Converts user-uploaded image files into optimized Base64 Data URLs stored directly in DB
function fileToDataUrl(file, maxWidth = 600, maxHeight = 600) {
  return new Promise((resolve) => {
    if (!file) return resolve(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => resolve(e.target.result);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

export default function FarmerMyCropsPage() {
  const { user } = useAuth();
  const [crops, setCrops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState(null);

  const emptyForm = {
    name: '',
    category: cropCategories[0],
    description: '',
    price: '',
    unit: 'kg',
    quantity: '',
    location: '',
    image_url: '',        // direct URL field
    imageFile: null,      // local file selection
    imagePreview: '',     // local preview
  };
  const [form, setForm] = useState(emptyForm);

  // ── Load crops ──────────────────────────────────────────
  const loadCrops = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('crops')
        .select('*')
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (err) throw err;
      
      // Clean up any blob: URLs that might have been saved in earlier tests
      const cleaned = (data || []).map(c => ({
        ...c,
        image_url: c.image_url && !c.image_url.startsWith('blob:')
          ? c.image_url
          : (FALLBACK_IMAGES[c.category] || null)
      }));

      setCrops(cleaned);
    } catch (e) {
      setError('Failed to load crops. Please try refreshing.');
      console.error('loadCrops error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadCrops(); }, [loadCrops]);

  const selectedCrop = useMemo(
    () => crops.find(c => c.id === selectedCropId) || null,
    [crops, selectedCropId]
  );

  const totals = useMemo(() => ({
    total:  crops.length,
    active: crops.filter(c => getDerivedStatus(c.quantity, c.status) === 'active').length,
    oos:    crops.filter(c => getDerivedStatus(c.quantity, c.status) === 'out_of_stock').length,
  }), [crops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return crops.filter(c => {
      const derived = getDerivedStatus(c.quantity, c.status);
      if (q && !`${c.name} ${c.category}`.toLowerCase().includes(q)) return false;
      if (category !== 'all' && c.category !== category) return false;
      if (status !== 'all' && derived !== status) return false;
      return true;
    });
  }, [crops, query, category, status]);

  // ── Modal helpers ────────────────────────────────────────
  const openAddModal = () => {
    setModalMode('add');
    setSelectedCropId(null);
    setFormError('');
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (crop) => {
    setModalMode('edit');
    setSelectedCropId(crop.id);
    setFormError('');
    setForm({
      name:         crop.name,
      category:     crop.category,
      description:  crop.description || '',
      price:        String(crop.price ?? ''),
      unit:         crop.unit ?? 'kg',
      quantity:     String(crop.quantity ?? ''),
      location:     crop.location ?? '',
      image_url:    crop.image_url || '',
      imageFile:    null,
      imagePreview: crop.image_url || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setFormError(''); };

  // ── Save crop ────────────────────────────────────────────
  const saveCrop = async () => {
    setFormError('');
    if (!form.name.trim())     { setFormError('Crop name is required.'); return; }
    if (!form.price || isNaN(Number(form.price)))    { setFormError('Enter a valid price.'); return; }
    if (!form.quantity || isNaN(Number(form.quantity))) { setFormError('Enter a valid quantity.'); return; }
    if (!form.location.trim()) { setFormError('Pickup location is required.'); return; }

    setSaveLoading(true);
    try {
      const quantity = normalizeNumber(form.quantity);
      const derivedStatus = quantity <= 0 ? 'out_of_stock' : 'active';

      // 1. Process image file if selected into permanent Data URL
      let finalImageUrl = form.image_url || null;

      if (form.imageFile) {
        const dataUrl = await fileToDataUrl(form.imageFile);
        if (dataUrl) {
          finalImageUrl = dataUrl;
        }
      }

      // Never allow blob: URLs in database
      if (!finalImageUrl || finalImageUrl.startsWith('blob:')) {
        finalImageUrl = form.imagePreview && !form.imagePreview.startsWith('blob:')
          ? form.imagePreview
          : (FALLBACK_IMAGES[form.category] || null);
      }

      if (modalMode === 'add') {
        const { error: insertErr } = await supabase
          .from('crops')
          .insert({
            farmer_id:   user.id,
            name:        form.name.trim(),
            category:    form.category,
            description: form.description,
            price:       normalizeNumber(form.price),
            unit:        form.unit || 'kg',
            quantity,
            location:    form.location.trim(),
            status:      derivedStatus,
            image_url:   finalImageUrl,
          });

        if (insertErr) throw insertErr;

      } else {
        const { error: updateErr } = await supabase
          .from('crops')
          .update({
            name:        form.name.trim(),
            category:    form.category,
            description: form.description,
            price:       normalizeNumber(form.price),
            unit:        form.unit || 'kg',
            quantity,
            location:    form.location.trim(),
            status:      derivedStatus,
            image_url:   finalImageUrl,
          })
          .eq('id', selectedCropId)
          .eq('farmer_id', user.id);

        if (updateErr) throw updateErr;
      }

      setIsModalOpen(false);
      await loadCrops();

    } catch (e) {
      console.error('saveCrop error:', e);
      setFormError(e.message || 'Failed to save crop. Please try again.');
    } finally {
      setSaveLoading(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────
  const deleteCrop = async (cropId) => {
    if (!window.confirm('Delete this crop listing from the marketplace?')) return;
    const { error: delErr } = await supabase
      .from('crops')
      .delete()
      .eq('id', cropId)
      .eq('farmer_id', user.id);

    if (delErr) {
      alert('Failed to delete: ' + delErr.message);
    } else {
      setCrops(prev => prev.filter(c => c.id !== cropId));
    }
  };

  // ── Toggle paused / active ───────────────────────────────
  const toggleAvailable = async (crop) => {
    const derived = getDerivedStatus(crop.quantity, crop.status);
    if (derived === 'out_of_stock') {
      alert('This crop is out of stock. Update quantity > 0 first.');
      return;
    }
    const nextStatus = crop.status === 'paused' ? 'active' : 'paused';
    const { error: updErr } = await supabase
      .from('crops')
      .update({ status: nextStatus })
      .eq('id', crop.id)
      .eq('farmer_id', user.id);

    if (!updErr) {
      setCrops(prev => prev.map(c => c.id === crop.id ? { ...c, status: nextStatus } : c));
    }
  };

  // ── Handle image file pick ───────────────────────────────
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({
      ...f,
      imageFile:    file,
      imagePreview: URL.createObjectURL(file),
      image_url:    '', // clear manual URL if file chosen
    }));
  };

  // ── Render ───────────────────────────────────────────────
  return (
    <div className="fm-page">
      <div className="fm-header">
        <div>
          <h2 className="fm-title">My Crops</h2>
          <div className="fm-subtitle">Manage your listings. Active crops appear in the buyer marketplace.</div>
        </div>
        <button type="button" className="fm-add-btn" onClick={openAddModal}>
          <Plus size={16} /> Add New Crop
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.75rem',
          background: '#ffebee', color: '#c62828',
          padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.875rem'
        }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button onClick={loadCrops} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#c62828', fontWeight: 700 }}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="fm-stats">
        <div className="fm-stat">
          <div className="fm-stat-label">Total Crops</div>
          <div className="fm-stat-value">{totals.total}</div>
        </div>
        <div className="fm-stat">
          <div className="fm-stat-label">Active</div>
          <div className="fm-stat-value fm-stat-value-active">{totals.active}</div>
        </div>
        <div className="fm-stat">
          <div className="fm-stat-label">Out of Stock</div>
          <div className="fm-stat-value fm-stat-value-oos">{totals.oos}</div>
        </div>
      </div>

      {/* Search + filters */}
      <div className="fm-filters">
        <div className="fm-search">
          <Search size={16} className="fm-search-icon" />
          <input
            type="text"
            className="fm-search-input"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="fm-filter-selects">
          <select className="fm-select" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="all">All Categories</option>
            {cropCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="fm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {cropStatuses.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem', gap: '0.75rem', color: '#777' }}>
          <Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Loading your crops...</span>
        </div>
      ) : filtered.length > 0 ? (
        <div className="fm-table-wrap">
          <table className="fm-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Unit</th>
                <th>Quantity</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(crop => {
                const derived = getDerivedStatus(crop.quantity, crop.status);
                const isPaused = derived !== 'out_of_stock' && crop.status === 'paused';
                const imgSrc = crop.image_url || FALLBACK_IMAGES[crop.category];
                return (
                  <tr key={crop.id}>
                    <td>
                      <div className="fm-thumb">
                        {imgSrc
                          ? <img src={imgSrc} alt={crop.name} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f2', borderRadius: '6px' }}>
                              <ImageIcon size={20} color="#aaa" />
                            </div>
                        }
                      </div>
                    </td>
                    <td className="fm-td-strong">{crop.name}</td>
                    <td>{crop.category}</td>
                    <td>₵{crop.price}</td>
                    <td>{crop.unit}</td>
                    <td>
                      <span className={derived === 'out_of_stock' ? 'fm-oos-text' : ''}>{crop.quantity}</span>
                    </td>
                    <td><StatusBadge status={derived} /></td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="fm-actions">
                        <button type="button" className="fm-action" onClick={() => openEditModal(crop)}>
                          <Pencil size={16} /> Edit
                        </button>
                        <button type="button" className="fm-action fm-action-danger" onClick={() => deleteCrop(crop.id)}>
                          <Trash2 size={16} /> Delete
                        </button>
                        <button type="button" className="fm-action" onClick={() => toggleAvailable(crop)}>
                          {isPaused
                            ? <><PlayCircle size={16} /> Activate</>
                            : <><PauseCircle size={16} /> Pause</>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="fm-empty">
          <div className="fm-empty-emoji">🌱</div>
          <h3>No crops found</h3>
          <p>{crops.length === 0 ? 'You have not listed any crops yet. Add your first crop to appear in the marketplace!' : 'Try adjusting your filters.'}</p>
          <button type="button" className="fm-add-btn fm-add-btn-solid" onClick={openAddModal}>
            <Plus size={16} /> {crops.length === 0 ? 'Add Your First Crop' : 'Add Crop'}
          </button>
        </div>
      )}

      {/* ── Add / Edit Modal ── */}
      {isModalOpen && (
        <div className="fm-modal-overlay" onClick={closeModal}>
          <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-modal-header">
              <div>
                <h3 className="fm-modal-title">{modalMode === 'add' ? 'Add New Crop' : 'Edit Crop'}</h3>
                <div className="fm-modal-subtitle">
                  {modalMode === 'add'
                    ? 'This crop will appear live in the buyer marketplace once saved.'
                    : 'Changes are immediately reflected in the marketplace.'}
                </div>
              </div>
              <button type="button" className="fm-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="fm-modal-body">
              {/* Form error */}
              {formError && (
                <div style={{
                  background: '#ffebee', color: '#c62828',
                  padding: '0.65rem 1rem', borderRadius: '8px',
                  marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600
                }}>
                  ⚠️ {formError}
                </div>
              )}

              <div className="fm-form-grid">
                {/* Name */}
                <div className="fm-form-group">
                  <label className="fm-label">Crop Name *</label>
                  <input
                    className="fm-input"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Fresh Tomatoes"
                  />
                </div>

                {/* Category */}
                <div className="fm-form-group">
                  <label className="fm-label">Category *</label>
                  <select
                    className="fm-input"
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {cropCategories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Description */}
                <div className="fm-form-group fm-span-2">
                  <label className="fm-label">Description</label>
                  <textarea
                    className="fm-textarea"
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Describe your crop: freshness, harvest date, quality, etc."
                  />
                </div>

                {/* Price */}
                <div className="fm-form-group">
                  <label className="fm-label">Price (₵) *</label>
                  <input
                    className="fm-input"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 12"
                    inputMode="decimal"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Unit */}
                <div className="fm-form-group">
                  <label className="fm-label">Selling Unit *</label>
                  <select
                    className="fm-input"
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                  >
                    <option value="kg">kg</option>
                    <option value="g">gram (g)</option>
                    <option value="bag">bag</option>
                    <option value="crate">crate</option>
                    <option value="bunch">bunch</option>
                    <option value="dozen">dozen</option>
                    <option value="piece">piece</option>
                    <option value="litre">litre</option>
                  </select>
                </div>

                {/* Quantity */}
                <div className="fm-form-group">
                  <label className="fm-label">Available Quantity *</label>
                  <input
                    className="fm-input"
                    value={form.quantity}
                    onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="e.g. 120"
                    inputMode="numeric"
                    type="number"
                    min="0"
                    step="1"
                  />
                </div>

                {/* Location */}
                <div className="fm-form-group">
                  <label className="fm-label">Pickup Location *</label>
                  <input
                    className="fm-input"
                    value={form.location}
                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Kumasi, Ashanti"
                  />
                </div>

                {/* Image */}
                <div className="fm-form-group fm-span-2">
                  <label className="fm-label">Crop Photo</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {/* File upload */}
                    <div className="fm-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageFile}
                        id="crop-image-upload"
                      />
                      <div className="fm-upload-hint">
                        <ImageIcon size={16} /> Pick a photo from your device
                      </div>
                    </div>
                    {/* OR URL */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                      <span style={{ fontSize: '0.78rem', color: '#aaa', whiteSpace: 'nowrap' }}>or paste an image URL</span>
                      <div style={{ flex: 1, height: 1, background: '#e0e0e0' }} />
                    </div>
                    <input
                      className="fm-input"
                      value={form.image_url}
                      onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value, imagePreview: e.target.value, imageFile: null }))}
                      placeholder="https://..."
                    />
                  </div>

                  {/* Preview */}
                  {(form.imagePreview || form.image_url) && (
                    <div className="fm-image-preview-grid" style={{ marginTop: '0.75rem' }}>
                      <div className="fm-image-preview">
                        <img
                          src={form.imagePreview || form.image_url}
                          alt="preview"
                          onError={(e) => { e.target.style.display = 'none'; }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="fm-modal-footer">
              <button type="button" className="fm-btn fm-btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button
                type="button"
                className="fm-btn fm-btn-primary"
                onClick={saveCrop}
                disabled={saveLoading}
              >
                {saveLoading
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                  : (modalMode === 'add' ? '🌱 Add to Marketplace' : '✅ Save Changes')
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Spinner animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
