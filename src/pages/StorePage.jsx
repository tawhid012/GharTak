import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Clock, MapPin, Search, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export const StorePage = () => {
  const { currentRoute, goBack, selectedLocation } = useApp();
  const storeId = currentRoute.params?.storeId || 'store-reliance';

  const [store, setStore] = useState(null);
  const [storeProducts, setStoreProducts] = useState([]);
  const [selectedSubCat, setSelectedSubCat] = useState('All');
  const [searchInStore, setSearchInStore] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const [storeData, productsData] = await Promise.all([
          api.getStoreById(storeId, selectedLocation),
          api.getProducts({ storeId }, selectedLocation)
        ]);
        setStore(storeData);
        setStoreProducts(productsData);
      } catch (err) {
        console.error('Error fetching store:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStore();
  }, [storeId, selectedLocation]);

  if (!store && !loading) {
    return (
      <div className="gt-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Store not found</h2>
        <button onClick={goBack} className="gt-btn gt-btn-primary gt-btn-sm" style={{ marginTop: '14px' }}>
          Back to Marketplace
        </button>
      </div>
    );
  }

  // Filter products by in-store category or in-store search
  const subCategories = ['All', ...(store?.categories || ['Dairy', 'Groceries', 'Fruits', 'Vegetables'])];

  let filteredProducts = [...storeProducts];
  if (selectedSubCat !== 'All') {
    filteredProducts = filteredProducts.filter(p =>
      p.category.toLowerCase().includes(selectedSubCat.toLowerCase()) ||
      p.name.toLowerCase().includes(selectedSubCat.toLowerCase())
    );
  }

  if (searchInStore.trim()) {
    const q = searchInStore.toLowerCase().trim();
    filteredProducts = filteredProducts.filter(p =>
      p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    );
  }

  return (
    <div className="gt-container" style={{ paddingTop: '16px' }}>
      {/* Back button */}
      <button
        onClick={goBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '14px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--gt-text-secondary)'
        }}
        aria-label="Go back"
      >
        <ArrowLeft size={16} />
        <span>Back</span>
      </button>

      {/* Store Header Card */}
      <div
        style={{
          backgroundColor: 'var(--gt-bg-surface)',
          borderRadius: 'var(--gt-radius-2xl)',
          overflow: 'hidden',
          border: '1px solid var(--gt-border-subtle)',
          boxShadow: 'var(--gt-shadow-sm)',
          marginBottom: '20px'
        }}
      >
        <div style={{ height: '140px', width: '100%', position: 'relative' }}>
          <img
            src={store?.bannerImage || store?.image}
            alt={store?.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)',
              color: '#fff',
              padding: '4px 10px',
              borderRadius: 'var(--gt-radius-full)',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={12} />
            <span>{store?.deliveryTime}</span>
          </div>
        </div>

        <div style={{ padding: '18px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gt-text-primary)' }}>
                {store?.name}
              </h1>
              <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)', marginTop: '2px' }}>
                {store?.category} • {store?.distance} • {store?.open ? <span style={{ color: 'var(--gt-success)', fontWeight: 600 }}>Open Now</span> : 'Closed'}
              </p>
              <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} />
                <span>{store?.address}</span>
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="gt-rating-pill" style={{ padding: '4px 8px', fontSize: '0.875rem' }}>
                <Star size={13} fill="#fff" />
                <span>{store?.rating}</span>
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                ({store?.reviewCount}+ ratings)
              </span>
            </div>
          </div>

          {/* Store Highlight banner */}
          <div
            style={{
              marginTop: '16px',
              padding: '12px 16px',
              borderRadius: 'var(--gt-radius-lg)',
              backgroundColor: 'var(--gt-primary-surface)',
              border: '1px solid rgba(255, 107, 53, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gt-primary)', textTransform: 'uppercase' }}>
                Store Offer
              </span>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gt-text-primary)' }}>
                {store?.tagline || 'Freshness you can trust'}
              </div>
            </div>
            {store?.discountBadge && (
              <span className="gt-badge gt-badge-orange">{store.discountBadge}</span>
            )}
          </div>

          {/* 7 KM Serviceability Warning Banner */}
          {store?.isServiceable === false && (
            <div
              style={{
                marginTop: '12px',
                padding: '12px 16px',
                borderRadius: 'var(--gt-radius-lg)',
                backgroundColor: '#FEE2E2',
                border: '1.5px solid #EF4444',
                color: '#991B1B',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '0.875rem',
                fontWeight: 600
              }}
            >
              <span>⚠️ This store isn't currently delivering to your location. Distance: {store?.distance} (Max service radius: 7 KM).</span>
            </div>
          )}
        </div>
      </div>

      {/* In-Store Search & Category Tabs */}
      <div style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--gt-bg-surface)',
            border: '1px solid var(--gt-border-subtle)',
            borderRadius: 'var(--gt-radius-full)',
            padding: '8px 16px',
            marginBottom: '14px'
          }}
        >
          <Search size={16} color="var(--gt-text-muted)" />
          <input
            type="text"
            placeholder={`Search in ${store?.name || 'store'}...`}
            value={searchInStore}
            onChange={(e) => setSearchInStore(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              flex: 1,
              backgroundColor: 'transparent',
              fontSize: '0.875rem'
            }}
          />
          {searchInStore && (
            <button onClick={() => setSearchInStore('')} style={{ color: 'var(--gt-text-muted)' }}>
              ✕
            </button>
          )}
        </div>

        {/* Categories within Store */}
        <div
          className="gt-hide-scrollbar"
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}
        >
          {subCategories.map((sub) => {
            const isSelected = selectedSubCat === sub;
            return (
              <button
                key={sub}
                onClick={() => setSelectedSubCat(sub)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 'var(--gt-radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  backgroundColor: isSelected ? 'var(--gt-dark)' : 'var(--gt-bg-surface)',
                  color: isSelected ? '#FFFFFF' : 'var(--gt-text-primary)',
                  border: `1px solid ${isSelected ? 'var(--gt-dark)' : 'var(--gt-border-subtle)'}`
                }}
              >
                {sub}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--gt-text-muted)' }}>
          <p>No products match your filter in this store.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px'
          }}
        >
          {filteredProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
