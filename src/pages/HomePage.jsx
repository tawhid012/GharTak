import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, Sparkles, Flame, Store as StoreIcon, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { StoreCard } from '../components/StoreCard';
import { CategoryCard } from '../components/CategoryCard';

export const HomePage = () => {
  const { navigate, searchQuery, setSearchQuery, selectedLocation } = useApp();
  const [categories, setCategories] = useState([]);
  const [popularProducts, setPopularProducts] = useState([]);
  const [assamSpecials, setAssamSpecials] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        const [catList, popList, specialList, storeList] = await Promise.all([
          api.getCategories(),
          api.getProducts({ popular: true }, selectedLocation),
          api.getProducts({ categoryId: 'cat-assam' }, selectedLocation),
          api.getStores({}, selectedLocation)
        ]);
        setCategories(catList);
        setPopularProducts(popList.slice(0, 8));
        setAssamSpecials(specialList.slice(0, 4));
        setStores(storeList.slice(0, 4));
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHomeData();
  }, [selectedLocation]);

  return (
    <div className="gt-container" style={{ paddingTop: '16px' }}>
      {/* Prominent Marketplace Search Bar */}
      <div
        style={{ marginBottom: '20px' }}
        onClick={() => navigate('search')}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: 'var(--gt-bg-surface)',
            border: '1.5px solid var(--gt-border-default)',
            borderRadius: 'var(--gt-radius-full)',
            padding: '12px 20px',
            boxShadow: 'var(--gt-shadow-xs)',
            cursor: 'pointer'
          }}
        >
          <Search size={20} color="var(--gt-primary)" />
          <span style={{ color: 'var(--gt-text-muted)', fontSize: '0.9375rem', fontWeight: 500 }}>
            Search products, stores & essentials in Hailakandi...
          </span>
        </div>
      </div>

      {/* Hero Promotional Banner */}
      <section className="gt-hero-banner" aria-label="Welcome Promotion">
        <div className="gt-hero-banner-accent" />
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div className="gt-hero-badge">
            <Sparkles size={12} />
            <span>Fast Hyperlocal Delivery</span>
          </div>
          <h1 className="gt-hero-title">
            Everything you need,<br />GharTak.
          </h1>
          <p className="gt-hero-subtitle">
            Groceries • Daily Essentials • Farm Produce • Fresh Breads from top local stores delivered in 15 mins across Hailakandi.
          </p>
        </div>

        <div style={{ position: 'relative', zIndex: 2, marginTop: '16px' }}>
          <button
            onClick={() => navigate('explore')}
            className="gt-btn gt-btn-primary gt-btn-sm"
            aria-label="Order Now"
          >
            <span>Order Now</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Shop By Category */}
      <section style={{ marginBottom: '32px' }} aria-labelledby="cat-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <h2 id="cat-heading" style={{ fontSize: '1.1875rem', fontWeight: 700 }}>
            Shop by Category
          </h2>
          <button
            onClick={() => navigate('explore')}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>See All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Circular Category Grid / Horizontal Scroll */}
        <div
          className="gt-hide-scrollbar"
          style={{
            display: 'grid',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(84px, 1fr)',
            gap: '12px',
            overflowX: 'auto',
            paddingBottom: '8px'
          }}
        >
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* Popular Near You Products */}
      <section style={{ marginBottom: '36px' }} aria-labelledby="pop-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 id="pop-heading" style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Popular Near You</span>
              <span className="gt-badge gt-badge-orange" style={{ fontSize: '0.625rem' }}>
                <Flame size={10} /> Fast Selling
              </span>
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              Top picks delivered right to your door in Hailakandi
            </p>
          </div>

          <button
            onClick={() => navigate('explore')}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>View All</span>
            <ArrowRight size={13} />
          </button>
        </div>

        {/* Products Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px'
          }}
        >
          {popularProducts.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>

      {/* Offers & Perks Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #FFF4ED 0%, #FFECE0 100%)',
          border: '1px solid rgba(255, 107, 53, 0.2)',
          borderRadius: 'var(--gt-radius-2xl)',
          padding: '20px 24px',
          marginBottom: '36px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div>
          <span className="gt-badge gt-badge-orange" style={{ marginBottom: '6px' }}>
            Hailakandi Express
          </span>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--gt-text-primary)' }}>
            Fresh Deliveries From Local Shops
          </h3>
          <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)' }}>
            Daily essentials, groceries, dairy and snacks delivered directly to your doorstep in Hailakandi.
          </p>
        </div>
        <button
          onClick={() => navigate('explore', { view: 'stores' })}
          className="gt-btn gt-btn-primary gt-btn-sm"
        >
          Explore Stores
        </button>
      </section>

      {/* Stores Near You */}
      <section style={{ marginBottom: '36px' }} aria-labelledby="stores-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 id="stores-heading" style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>Stores Near You</span>
              <span className="gt-badge gt-badge-green" style={{ fontSize: '0.625rem' }}>
                Open Now
              </span>
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              Verified local shops in Hailakandi fulfilling fast delivery
            </p>
          </div>

          <button
            onClick={() => navigate('explore', { view: 'stores' })}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>All Stores</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}
        >
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      </section>

      {/* Assam Specials Section */}
      <section style={{ marginBottom: '36px' }} aria-labelledby="assam-heading">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 id="assam-heading" style={{ fontSize: '1.25rem', fontWeight: 700 }}>
              Assam Specials & Garden Tea
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              Authentic Barak Valley estate tea, cold-pressed mustard oil and local pride
            </p>
          </div>

          <button
            onClick={() => navigate('explore', { categoryId: 'cat-assam' })}
            style={{
              fontSize: '0.8125rem',
              fontWeight: 600,
              color: 'var(--gt-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>Explore</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '14px'
          }}
        >
          {assamSpecials.map((prod) => (
            <ProductCard key={prod.id} product={prod} />
          ))}
        </div>
      </section>
    </div>
  );
};
