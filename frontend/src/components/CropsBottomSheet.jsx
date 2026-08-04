import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, ArrowRight, ShoppingCart, Check, Leaf } from 'lucide-react';
import './CropsBottomSheet.css';

export default function CropsBottomSheet({ farmer, open, onClose, onAddToCart, cart = {} }) {
  const [addedItems, setAddedItems] = useState({});

  if (!open || !farmer) return null;

  const handleAdd = (crop) => {
    onAddToCart(crop, 1);
    setAddedItems(prev => ({ ...prev, [crop.id]: true }));
    setTimeout(() => {
      setAddedItems(prev => ({ ...prev, [crop.id]: false }));
    }, 1500);
  };

  const crops = farmer.crops || [];

  return (
    <div className="bs-backdrop" onClick={onClose}>
      <div className="bs-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Handle bar for visual cue / drag indicator */}
        <div className="bs-drag-handle" />

        {/* Header */}
        <div className="bs-header">
          <div className="bs-farmer-meta">
            <img src={farmer.avatar} alt={farmer.name} className="bs-avatar" />
            <div>
              <h3 className="bs-farm-name">{farmer.farmName}</h3>
              <p className="bs-farmer-location">{farmer.location}</p>
            </div>
          </div>

          <div className="bs-header-right">
            <Link
              to={`/farmers/${farmer.id}`}
              className="bs-profile-link"
              onClick={onClose}
            >
              View Full Profile →
            </Link>
            <button className="bs-close-btn" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="bs-body">
          <div className="bs-title-row">
            <h4 className="bs-section-title">Available Farm Crops</h4>
            <span className="bs-crop-count">{crops.length} items</span>
          </div>

          {crops.length > 0 ? (
            <div className="bs-crops-scroll">
              {crops.map((crop) => {
                const qtyInCart = cart[crop.id] || 0;
                const isRecentlyAdded = addedItems[crop.id];

                return (
                  <div key={crop.id} className="bs-crop-card">
                    <div className="bs-crop-img-wrap">
                      <img src={crop.image} alt={crop.name} className="bs-crop-img" />
                      {qtyInCart > 0 && (
                        <span className="bs-cart-qty-badge">{qtyInCart} in cart</span>
                      )}
                    </div>
                    <div className="bs-crop-info">
                      <h5 className="bs-crop-name">{crop.name}</h5>
                      <p className="bs-crop-price">
                        ₵{crop.price} <span className="bs-crop-unit">/ {crop.unit}</span>
                      </p>
                      <button
                        type="button"
                        className={`bs-add-btn ${isRecentlyAdded ? 'bs-add-btn-success' : ''}`}
                        onClick={() => handleAdd(crop)}
                      >
                        {isRecentlyAdded ? (
                          <>
                            <Check size={15} /> Added!
                          </>
                        ) : (
                          <>
                            <ShoppingCart size={15} /> Add to Cart
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bs-empty-crops">
              <Leaf size={32} color="#2D6A4F" />
              <p>No crops currently listed for this farmer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
