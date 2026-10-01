import React, { useState, useEffect } from 'react';
import { Filter, SlidersHorizontal, ArrowUpDown, Check, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { StoreCard } from '../components/StoreCard';

export const ExplorePage = () => {
  const { currentRoute, navigate, selectedLocation } = useApp();
  const initialCategory = currentRoute.params?.categoryId || 'all';
  const initialView = currentRoute.params?.view || 'products';

  const [activeView, setActiveView] = useState(initialView); // 'products' | 'stores'
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [filterUnder100, setFilterUnder100] = useState(false);
  const [loading, setLoading] = useState(true);

  // Sync category if navigated with param
  useEffect(() => {
    if (currentRoute.params?.categoryId) {
      setSelectedCategory(currentRoute.params.categoryId);
    }
  }, [currentRoute.params?.categoryId]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [catList, prodList, storeList] = await Promise.all([
          api.getCategories(),
          api.getProducts({
            categoryId: selectedCategory === 'all' ? undefined : selectedCategory,
            sortBy: sortBy === 'recommended' ? undefined : sortBy
          }, selectedLocation),
          api.getStores({}, selectedLocation)
        ]);
        setCategories(catList);
        setProducts(prodList);
        setStores(storeList);
      } catch (err) {
        console.error('Error fetching explore data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCategory, sortBy, selectedLocation]);

  // Apply in-memory client filters
  let displayedProducts = [...products];
  if (filterUnder100) {
    displayedProducts = displayedProducts.filter(p => p.price <= 100);
  }

  return (
    <div className="gt-container" style={{ paddingTop: '20px' }}>
      {/* Page Title & View Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Explore Marketplace</h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
            Discover fresh items and local shops across Hailakandi
          </p>
        </div>

        {/* Tab Toggle: Products vs Stores */}
        <div
          style={{
            display: 'inline-flex',
            backgroundColor: 'var(--gt-bg-card-hover)',
            padding: '4px',
            borderRadius: 'var(--gt-radius-full)',
            border: '1px solid var(--gt-border-subtle)'
          }}
        >
          <button
            onClick={() => setActiveView('products')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--gt-radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: activeView === 'products' ? '#FFFFFF' : 'transparent',
              color: activeView === 'products' ? 'var(--gt-dark)' : 'var(--gt-text-muted)',
              boxShadow: activeView === 'products' ? 'var(--gt-shadow-xs)' : 'none'
            }}
          >
            Products ({displayedProducts.length})
          </button>
          <button
            onClick={() => setActiveView('stores')}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--gt-radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 600,
              backgroundColor: activeView === 'stores' ? '#FFFFFF' : 'transparent',
              color: activeView === 'stores' ? 'var(--gt-dark)' : 'var(--gt-text-muted)',
              boxShadow: activeView === 'stores' ? 'var(--gt-shadow-xs)' : 'none'
            }}
          >
            Stores ({stores.length})
          </button>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div
        className="gt-hide-scrollbar"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '16px'
        }}
      >
        <button
          onClick={() => setSelectedCategory('all')}
          style={{
            padding: '7px 16px',
            borderRadius: 'var(--gt-radius-full)',
            fontSize: '0.8125rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            backgroundColor: selectedCategory === 'all' ? 'var(--gt-primary)' : 'var(--gt-bg-surface)',
            color: selectedCategory === 'all' ? '#FFFFFF' : 'var(--gt-text-primary)',
            border: `1.5px solid ${selectedCategory === 'all' ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`
          }}
        >
          All Items
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '7px 16px',
                borderRadius: 'var(--gt-radius-full)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                backgroundColor: isSelected ? 'var(--gt-primary)' : 'var(--gt-bg-surface)',
                color: isSelected ? '#FFFFFF' : 'var(--gt-text-primary)',
                border: `1.5px solid ${isSelected ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Filter and Sort Toolbar */}
      {activeView === 'products' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            padding: '10px 14px',
            backgroundColor: 'var(--gt-bg-surface)',
            borderRadius: 'var(--gt-radius-lg)',
            border: '1px solid var(--gt-border-subtle)'
          }}
        >
          {/* Quick Filter chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--gt-text-muted)' }}>
              FILTERS:
            </span>
            <button
              onClick={() => setFilterUnder100(!filterUnder100)}
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--gt-radius-full)',
                backgroundColor: filterUnder100 ? 'var(--gt-primary-surface)' : 'var(--gt-bg-card-hover)',
                color: filterUnder100 ? 'var(--gt-primary)' : 'var(--gt-text-secondary)',
                border: `1px solid ${filterUnder100 ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              {filterUnder100 && <Check size={12} />}
              <span>Under ₹100</span>
            </button>
          </div>

          {/* Sort Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowUpDown size={14} color="var(--gt-text-muted)" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 'var(--gt-radius-sm)',
                border: '1px solid var(--gt-border-subtle)',
                backgroundColor: 'transparent',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="recommended">Recommended</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="fastest">Fastest Delivery</option>
            </select>
          </div>
        </div>
      )}

      {/* Grid Content */}
      {activeView === 'products' ? (
        displayedProducts.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '6px' }}>
              No products found
            </h3>
            <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', marginBottom: '16px' }}>
              Try adjusting your category or filter selection
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setFilterUnder100(false);
              }}
              className="gt-btn gt-btn-outline gt-btn-sm"
            >
              <RefreshCw size={14} />
              <span>Reset Filters</span>
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
            {displayedProducts.map((prod) => (
              <ProductCard key={prod.id} product={prod} />
            ))}
          </div>
        )
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '18px'
          }}
        >
          {stores.map((store) => (
            <StoreCard key={store.id} store={store} />
          ))}
        </div>
      )}
    </div>
  );
};
