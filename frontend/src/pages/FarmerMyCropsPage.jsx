import React, { useMemo, useState } from 'react';
import './FarmerMyCropsPage.css';

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Eye,
  PauseCircle,
  PlayCircle,
  Image as ImageIcon,
  X,
} from 'lucide-react';

const mockCrops = [
  {
    id: 'crop-1',
    name: 'Fresh Tomatoes',
    category: 'Vegetables',
    description: 'Juicy tomatoes from our greenhouse.',
    price: 12,
    unit: 'kg',
    quantity: 120,
    status: 'active',
    location: 'Kumasi, Ashanti',
    images: ['https://images.unsplash.com/photo-1592921870789-04563d55041c?auto=format&fit=crop&w=300&q=70'],
  },
  {
    id: 'crop-2',
    name: 'Red Pepper',
    category: 'Vegetables',
    description: 'Red peppers, dried and fresh batches.',
    price: 15,
    unit: 'kg',
    quantity: 0,
    status: 'out_of_stock',
    location: 'Ejisu, Ashanti',
    images: ['https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=300&q=70'],
  },
  {
    id: 'crop-3',
    name: 'Fresh Maize',
    category: 'Grains',
    description: 'Sweet corn maize harvested this week.',
    price: 8,
    unit: 'kg',
    quantity: 75,
    status: 'active',
    location: 'Ejisu, Ashanti',
    images: ['https://images.unsplash.com/photo-1601593346740-925612772716?auto=format&fit=crop&w=300&q=70'],
  },
  {
    id: 'crop-4',
    name: 'Cassava',
    category: 'Tubers',
    description: 'Fresh cassava roots for markets.',
    price: 6,
    unit: 'kg',
    quantity: 50,
    status: 'paused',
    location: 'Kumasi, Ashanti',
    images: ['https://images.unsplash.com/photo-1631207558636-d24c18bcfd6e?auto=format&fit=crop&w=300&q=70'],
  },
];

const cropCategories = ['Vegetables', 'Fruits', 'Grains', 'Tubers', 'Spices'];
const cropStatuses = [
  { value: 'all', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

function StatusBadge({ status }) {
  const map = {
    active: { label: 'Active', className: 'fm-badge fm-badge-active' },
    paused: { label: 'Paused', className: 'fm-badge fm-badge-paused' },
    out_of_stock: { label: 'Out of Stock', className: 'fm-badge fm-badge-oos' },
  };
  const info = map[status] || { label: status, className: 'fm-badge' };
  return <span className={info.className}>{info.label}</span>;
}

function getDerivedStatus(quantity, status) {
  // If quantity is 0, reflect out_of_stock regardless.
  if (Number(quantity) <= 0) return 'out_of_stock';
  return status;
}

function normalizeNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function FarmerMyCropsPage() {
  const [crops, setCrops] = useState(mockCrops);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  const [modalMode, setModalMode] = useState('add'); // add | edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCropId, setSelectedCropId] = useState(null);

  const [form, setForm] = useState({
    name: '',
    category: cropCategories[0],
    description: '',
    price: '',
    unit: 'kg',
    quantity: '',
    location: '',
    images: [], // File -> preview dataURL (mock)
  });

  const selectedCrop = useMemo(() => crops.find(c => c.id === selectedCropId) || null, [crops, selectedCropId]);

  const totals = useMemo(() => {
    const total = crops.length;
    const active = crops.filter(c => getDerivedStatus(c.quantity, c.status) === 'active').length;
    const oos = crops.filter(c => getDerivedStatus(c.quantity, c.status) === 'out_of_stock').length;
    return { total, active, oos };
  }, [crops]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return crops.filter(c => {
      const derived = getDerivedStatus(c.quantity, c.status);
      if (q) {
        const hay = `${c.name} ${c.category}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (category !== 'all' && c.category !== category) return false;
      if (status !== 'all' && derived !== status) return false;
      return true;
    });
  }, [crops, query, category, status]);

  const openAddModal = () => {
    setModalMode('add');
    setSelectedCropId(null);
    setForm({
      name: '',
      category: cropCategories[0],
      description: '',
      price: '',
      unit: 'kg',
      quantity: '',
      location: '',
      images: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (crop) => {
    setModalMode('edit');
    setSelectedCropId(crop.id);
    setForm({
      name: crop.name,
      category: crop.category,
      description: crop.description || '',
      price: String(crop.price ?? ''),
      unit: crop.unit ?? 'kg',
      quantity: String(crop.quantity ?? ''),
      location: crop.location ?? '',
      images: crop.images || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const saveCrop = () => {
    const payload = {
      ...selectedCrop,
      name: form.name.trim(),
      category: form.category,
      description: form.description,
      price: normalizeNumber(form.price),
      unit: form.unit,
      quantity: normalizeNumber(form.quantity),
      location: form.location.trim(),
      images: form.images.slice(0, 4),
    };

    const derived = getDerivedStatus(payload.quantity, payload.status || 'active');
    payload.status = payload.status || 'active';

    if (!payload.name) return;

    if (modalMode === 'add') {
      const newCrop = {
        ...payload,
        id: `crop-${Date.now()}`,
        status: derived === 'out_of_stock' ? 'active' : payload.status,
      };
      setCrops(prev => [newCrop, ...prev]);
    } else {
      setCrops(prev => prev.map(c => (c.id === payload.id ? { ...c, ...payload } : c)));
    }

    setIsModalOpen(false);
  };

  const deleteCrop = (cropId) => {
    // eslint-disable-next-line no-alert
    const ok = window.confirm('Delete this crop?');
    if (!ok) return;
    setCrops(prev => prev.filter(c => c.id !== cropId));
  };

  const toggleAvailable = (crop) => {
    const derived = getDerivedStatus(crop.quantity, crop.status);
    if (derived === 'out_of_stock') {
      // eslint-disable-next-line no-alert
      alert('This crop is out of stock. Set quantity > 0 to activate.');
      return;
    }

    setCrops(prev =>
      prev.map(c => {
        if (c.id !== crop.id) return c;
        const nextStatus = c.status === 'paused' ? 'active' : 'paused';
        return { ...c, status: nextStatus };
      })
    );
  };

  const headerRightButton = (
    <button type="button" className="fm-add-btn" onClick={openAddModal}>
      <Plus size={16} />
      Add New Crop
    </button>
  );

  return (
    <div className="fm-page">
      <div className="fm-header">
        <div>
          <h2 className="fm-title">My Crops</h2>
          <div className="fm-subtitle">Manage your crops, availability, and listing details.</div>
        </div>
        {headerRightButton}
      </div>

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
            {cropCategories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select className="fm-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            {cropStatuses.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Crop table */}
      {filtered.length > 0 ? (
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
                return (
                  <tr key={crop.id}>
                    <td>
                      <div className="fm-thumb">
                        <img src={(crop.images && crop.images[0]) || ''} alt={crop.name} />
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
                        <button
                          type="button"
                          className="fm-action"
                          onClick={() => toggleAvailable(crop)}
                        >
                          {isPaused ? (
                            <>
                              <PlayCircle size={16} /> Available
                            </>
                          ) : (
                            <>
                              <PauseCircle size={16} /> Pause
                            </>
                          )}
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
          <p>Try adjusting your filters or add a new crop.</p>
          <button type="button" className="fm-add-btn fm-add-btn-solid" onClick={openAddModal}>
            <Plus size={16} /> Add Crop
          </button>
        </div>
      )}

      {/* Add/Edit modal */}
      {isModalOpen && (
        <div className="fm-modal-overlay" onClick={closeModal}>
          <div className="fm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="fm-modal-header">
              <div>
                <h3 className="fm-modal-title">{modalMode === 'add' ? 'Add Crop' : 'Edit Crop'}</h3>
                <div className="fm-modal-subtitle">Fill out the details to list your crop.</div>
              </div>
              <button type="button" className="fm-modal-close" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <div className="fm-modal-body">
              <div className="fm-form-grid">
                <div className="fm-form-group">
                  <label className="fm-label">Name</label>
                  <input
                    className="fm-input"
                    value={form.name}
                    onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Fresh Tomatoes"
                  />
                </div>

                <div className="fm-form-group">
                  <label className="fm-label">Category</label>
                  <select
                    className="fm-input"
                    value={form.category}
                    onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {cropCategories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="fm-form-group fm-span-2">
                  <label className="fm-label">Description</label>
                  <textarea
                    className="fm-textarea"
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3}
                    placeholder="Short description about your crop"
                  />
                </div>

                <div className="fm-form-group">
                  <label className="fm-label">Price</label>
                  <input
                    className="fm-input"
                    value={form.price}
                    onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
                    placeholder="e.g. 12"
                    inputMode="decimal"
                  />
                </div>

                <div className="fm-form-group">
                  <label className="fm-label">Unit</label>
                  <input
                    className="fm-input"
                    value={form.unit}
                    onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))}
                    placeholder="kg"
                  />
                </div>

                <div className="fm-form-group">
                  <label className="fm-label">Quantity</label>
                  <input
                    className="fm-input"
                    value={form.quantity}
                    onChange={(e) => setForm(f => ({ ...f, quantity: e.target.value }))}
                    placeholder="e.g. 120"
                    inputMode="numeric"
                  />
                </div>

                <div className="fm-form-group fm-span-2">
                  <label className="fm-label">Location</label>
                  <input
                    className="fm-input"
                    value={form.location}
                    onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))}
                    placeholder="e.g. Kumasi, Ashanti"
                  />
                </div>

                <div className="fm-form-group fm-span-2">
                  <label className="fm-label">Image upload (max 4)</label>
                  <div className="fm-upload">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []).slice(0, 4);
                        // For demo, convert to object URLs (no async FileReader).
                        const previews = files.map(f => URL.createObjectURL(f));
                        setForm(f => ({ ...f, images: previews }));
                      }}
                    />
                    <div className="fm-upload-hint">
                      <ImageIcon size={16} /> Upload up to 4 images.
                    </div>
                  </div>

                  {form.images && form.images.length > 0 && (
                    <div className="fm-image-preview-grid">
                      {form.images.slice(0, 4).map((src, idx) => (
                        <div key={idx} className="fm-image-preview">
                          <img src={src} alt={`preview-${idx}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="fm-modal-footer">
              <button type="button" className="fm-btn fm-btn-secondary" onClick={closeModal}>
                Cancel
              </button>
              <button type="button" className="fm-btn fm-btn-primary" onClick={saveCrop}>
                {modalMode === 'add' ? 'Add Crop' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

