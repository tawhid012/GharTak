import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, ArrowRight, Store, ShoppingBag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';
import { StoreCard } from '../components/StoreCard';

export const SearchPage = () => {
  const { currentRoute, navigate } = useApp();
  const initialQuery = currentRoute.params?.query || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState({ products: [], stores: [], categories: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef(null);

  const suggestedKeywords = ['Milk', 'Amul Milk', 'Dairy', 'Paneer', 'Bananas', 'Tea', 'Reliance'];

  useEffect(() => {
    setRecentSearches(api.getRecentSearches());
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (searchTerm) => {
    const term = searchTerm.trim();
    if (!term) {
      setResults({ products: [], stores: [], categories: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const searchData = await api.searchAll(term);
    setResults(searchData);
    api.addRecentSearch(term);
    setRecentSearches(api.getRecentSearches());
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    handleSearch(val);
  };

  const handleClear = () => {
    setQuery('');
    setResults({ products: [], stores: [], categories: [] });
    setIsSearching(false);
    if (inputRef.current) inputRef.current.focus();
  };

  const handleChipClick = (term) => {
    setQuery(term);
    handleSearch(term);
  };

  const handleClearHistory = () => {
    api.clearRecentSearches();
    setRecentSearches([]);
  };

  const hasResults = results.products.length > 0 || results.stores.length > 0;
  const isQueryActive = query.trim().length > 0;

  return (
    <div className="gt-container" style={{ paddingTop: '16px' }}>
      {/* Search Input Box */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--gt-bg-surface)',
          border: '2px solid var(--gt-primary)',
          borderRadius: 'var(--gt-radius-full)',
          padding: '8px 18px',
          boxShadow: 'var(--gt-shadow-sm)',
          marginBottom: '18px'
        }}
      >
        <Search size={20} color="var(--gt-primary)" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search products, stores & essentials..."
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '1rem',
            fontWeight: 500,
            backgroundColor: 'transparent'
          }}
        />
        {query ? (
          <button
            onClick={handleClear}
            style={{
              padding: '4px',
              color: 'var(--gt-text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
            aria-label="Clear search"
          >
            <X size={18} />
          </button>
        ) : (
          <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>Hailakandi</span>
        )}
      </div>

      {/* Suggested Search Keywords Pills */}
      <div
        className="gt-hide-scrollbar"
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px'
        }}
      >
        {suggestedKeywords.map((kw) => (
          <button
            key={kw}
            onClick={() => handleChipClick(kw)}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--gt-radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              backgroundColor: query.toLowerCase() === kw.toLowerCase() ? 'var(--gt-primary)' : 'var(--gt-bg-surface)',
              color: query.toLowerCase() === kw.toLowerCase() ? '#FFFFFF' : 'var(--gt-text-secondary)',
              border: '1px solid var(--gt-border-subtle)',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease'
            }}
          >
            {kw}
          </button>
        ))}
      </div>

      {/* When NO query is typed: Show Recent Searches & Categories */}
      {!isQueryActive && (
        <div>
          {recentSearches.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }}
              >
                <h3
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: 'var(--gt-text-muted)'
                  }}
                >
                  Recent Searches
                </h3>
                <button
                  onClick={handleClearHistory}
                  style={{ fontSize: '0.75rem', color: 'var(--gt-primary)', fontWeight: 600 }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(term)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: 'var(--gt-radius-full)',
                      backgroundColor: 'var(--gt-bg-surface)',
                      border: '1px solid var(--gt-border-subtle)',
                      fontSize: '0.875rem',
                      color: 'var(--gt-text-primary)'
                    }}
                  >
                    <Clock size={14} color="var(--gt-text-muted)" />
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Category Jump */}
          <div>
            <h3
              style={{
                fontSize: '0.875rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                color: 'var(--gt-text-muted)',
                marginBottom: '12px'
              }}
            >
              Popular Categories
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {['Groceries', 'Dairy & Bakery', 'Assam Specials', 'Pharmacy', 'Food & Snacks'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleChipClick(cat)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--gt-radius-md)',
                    backgroundColor: 'var(--gt-bg-card-hover)',
                    border: '1px solid var(--gt-border-subtle)',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--gt-text-primary)'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* When Query is active: Results or Empty State */}
      {isQueryActive && (
        <div>
          {!hasResults ? (
            <div
              style={{
                padding: '60px 20px',
                textAlign: 'center',
                backgroundColor: 'var(--gt-bg-surface)',
                borderRadius: 'var(--gt-radius-xl)',
                border: '1px solid var(--gt-border-subtle)',
                marginTop: '10px'
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: 'var(--gt-radius-full)',
                  backgroundColor: 'var(--gt-primary-surface)',
                  color: 'var(--gt-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <Search size={28} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>
                No results for "{query}"
              </h3>
              <p style={{ color: 'var(--gt-text-muted)', fontSize: '0.875rem', maxWidth: '360px', margin: '0 auto 18px' }}>
                Try searching for a product (e.g. "milk", "banana", "tea"), or a store like "Reliance Fresh".
              </p>
              <button
                onClick={() => handleChipClick('Milk')}
                className="gt-btn gt-btn-primary gt-btn-sm"
              >
                Browse Popular "Milk"
              </button>
            </div>
          ) : (
            <div>
              {/* Matching Stores if any */}
              {results.stores.length > 0 && (
                <div style={{ marginBottom: '28px' }}>
                  <h3
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Store size={18} color="var(--gt-primary)" />
                    <span>Matching Stores ({results.stores.length})</span>
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: '14px'
                    }}
                  >
                    {results.stores.map((s) => (
                      <StoreCard key={s.id} store={s} />
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Products */}
              {results.products.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 700,
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <ShoppingBag size={18} color="var(--gt-primary)" />
                    <span>Matching Products ({results.products.length})</span>
                  </h3>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                      gap: '14px'
                    }}
                  >
                    {results.products.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
