import React from 'react';
import { Star, Clock, MapPin, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const StoreCard = ({ store }) => {
  const { navigate } = useApp();

  if (!store) return null;

  return (
    <article
      className="gt-store-card"
      onClick={() => navigate('store', { storeId: store.id })}
      role="region"
      aria-label={store.name}
    >
      {/* Store Banner Image */}
      <div className="gt-store-banner">
        <img
          src={store.bannerImage || store.image}
          alt={store.name}
          className="gt-store-banner-img"
          loading="lazy"
        />
        <div className="gt-store-badge-row">
          {store.open ? (
            <span className="gt-badge gt-badge-green">Open Now</span>
          ) : (
            <span className="gt-badge gt-badge-dark">Closed</span>
          )}
          {store.discountBadge && (
            <span className="gt-badge gt-badge-orange">
              <Tag size={10} />
              {store.discountBadge}
            </span>
          )}
        </div>
      </div>

      {/* Store Content */}
      <div className="gt-store-content">
        <div className="gt-store-name-row">
          <h3 className="gt-store-title">{store.name}</h3>
          <span className="gt-rating-pill">
            <Star size={11} fill="#fff" />
            <span>{store.rating}</span>
          </span>
        </div>

        <p className="gt-store-category">{store.category}</p>

        <div className="gt-store-info-row">
          <span className="gt-store-info-item">
            <Clock size={13} />
            <span>{store.deliveryTime}</span>
          </span>
          <span>•</span>
          <span className="gt-store-info-item">
            <MapPin size={13} />
            <span>{store.distance}</span>
          </span>
        </div>
      </div>
    </article>
  );
};
