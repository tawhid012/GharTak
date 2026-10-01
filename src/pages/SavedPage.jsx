import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, ShoppingBag, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export const SavedPage = () => {
  const { favourites, goBack, navigate } = useApp();
  const [savedProducts, setSavedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSaved = async () => {
      setLoading(true);
      try {
        const all = await api.getProducts();
        setSavedProducts(all.filter(p => favourites.includes(p.id)));
      } catch (err) {
        console.error('Error fetching saved:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSaved();
  }, [favourites]);

  return (
    <div className="gt-container" style={{ paddingTop: '20px' }}>
      <button
        onClick={goBack}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          marginBottom: '16px',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--gt-text-secondary)'
        }}
        aria-label="Back"
      >
        <ArrowLeft size={18} />
        <span>Back</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: 'var(--gt-radius-full)',
            backgroundColor: '#FEF2F2',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Heart size={20} fill="#EF4444" />
        </div>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Saved For Later</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
            {savedProducts.length} favourite products saved for fast re-ordering
          </p>
        </div>
      </div>

      {savedProducts.length === 0 ? (
        <div
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-2xl)',
            border: '1px solid var(--gt-border-subtle)'
          }}
        >
          <Heart size={44} style={{ margin: '0 auto 12px', color: '#EF4444', opacity: 0.3 }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
            No saved products yet
          </h3>
          <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
            Tap the heart icon on any product to save it here for fast reordering.
          </p>
          <button onClick={() => navigate('explore')} className="gt-btn gt-btn-primary">
            <span>Explore Products</span>
            <ArrowRight size={16} />
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px'
          }}
        >
          {savedProducts.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};
