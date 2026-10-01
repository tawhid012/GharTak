import React, { useState, useEffect } from 'react';
import { ArrowLeft, Heart, Share2, Star, ShieldCheck, Clock, Check, Plus, Minus, Store } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { ProductCard } from '../components/ProductCard';

export const ProductDetailPage = () => {
  const { currentRoute, goBack, navigate, addToCart, isFavourite, toggleFavourite, showToast } = useApp();
  const productId = currentRoute.params?.productId || 'p001';

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const prod = await api.getProductById(productId);
        if (prod) {
          setProduct(prod);
          setSelectedWeight(prod.weights?.[0] || prod.unit);
          setSelectedImage(prod.gallery?.[0] || prod.image);

          const related = await api.getProducts({ categoryId: prod.categoryId });
          setRelatedProducts(related.filter(p => p.id !== prod.id).slice(0, 4));
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
    setQuantity(1);
  }, [productId]);

  if (!product && !loading) {
    return (
      <div className="gt-container" style={{ padding: '60px 20px', textAlign: 'center' }}>
        <h2>Product not found</h2>
        <button onClick={goBack} className="gt-btn gt-btn-primary gt-btn-sm" style={{ marginTop: '14px' }}>
          Back to Marketplace
        </button>
      </div>
    );
  }

  const isFav = product ? isFavourite(product.id) : false;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: `Buy ${product?.name} on GharTak!`,
        url: window.location.href
      }).catch(() => {});
    } else {
      showToast('Product link copied to clipboard!', 'success');
    }
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity, selectedWeight);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity, selectedWeight);
      navigate('checkout');
    }
  };

  return (
    <div className="gt-container" style={{ paddingTop: '16px' }}>
      {/* Top Navigation Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <button
          onClick={goBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--gt-text-secondary)'
          }}
          aria-label="Back"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => product && toggleFavourite(product.id)}
            className="gt-icon-btn"
            style={{ width: '36px', height: '36px' }}
            aria-label="Add to favourites"
          >
            <Heart size={18} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : 'currentColor'} />
          </button>
          <button
            onClick={handleShare}
            className="gt-icon-btn"
            style={{ width: '36px', height: '36px' }}
            aria-label="Share product"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Main Details Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px',
          marginBottom: '48px'
        }}
      >
        {/* Gallery / Image Hero */}
        <div>
          <div
            style={{
              width: '100%',
              aspectRatio: '1 / 1',
              borderRadius: 'var(--gt-radius-2xl)',
              overflow: 'hidden',
              backgroundColor: '#F8F6F2',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '12px'
            }}
          >
            <img
              src={selectedImage || product?.image}
              alt={product?.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnail Gallery if multiple */}
          {product?.gallery && product.gallery.length > 1 && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {product.gallery.map((imgUrl, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(imgUrl)}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: 'var(--gt-radius-md)',
                    overflow: 'hidden',
                    border: `2px solid ${selectedImage === imgUrl ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`
                  }}
                >
                  <img src={imgUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info & Actions */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span className="gt-badge gt-badge-green">
              <Check size={12} /> In Stock
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} />
              <span>Delivered in ~15 min</span>
            </span>
          </div>

          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--gt-text-primary)', marginBottom: '8px' }}>
            {product?.name}
          </h1>

          {/* Rating & Tags */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <span className="gt-rating-pill" style={{ padding: '3px 8px', fontSize: '0.8125rem' }}>
              <Star size={12} fill="#fff" />
              <span>{product?.rating}</span>
            </span>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)' }}>
              ({product?.reviewCount?.toLocaleString()} reviews)
            </span>
            {product?.tags && (
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--gt-text-secondary)' }}>
                • {product.tags.join(' • ')}
              </span>
            )}
          </div>

          {/* Price Box */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              padding: '14px 18px',
              backgroundColor: 'var(--gt-bg-surface)',
              borderRadius: 'var(--gt-radius-lg)',
              border: '1px solid var(--gt-border-subtle)',
              marginBottom: '20px'
            }}
          >
            <span style={{ fontFamily: 'var(--gt-font-display)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--gt-text-primary)' }}>
              ₹{product?.price}
            </span>
            {product?.originalPrice && (
              <span style={{ fontSize: '1.125rem', color: 'var(--gt-text-muted)', textDecoration: 'line-through' }}>
                ₹{product.originalPrice}
              </span>
            )}
            {product?.discount && (
              <span className="gt-badge gt-badge-orange" style={{ fontSize: '0.75rem' }}>
                {product.discount}
              </span>
            )}
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-text-muted)', marginLeft: 'auto' }}>
              Inclusive of all taxes
            </span>
          </div>

          {/* Weight / Pack Variant Pills */}
          {product?.weights && product.weights.length > 0 && (
            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  color: 'var(--gt-text-muted)',
                  marginBottom: '10px'
                }}
              >
                Selected Pack / Weight
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {product.weights.map((w) => {
                  const isSelected = selectedWeight === w;
                  return (
                    <button
                      key={w}
                      onClick={() => setSelectedWeight(w)}
                      style={{
                        padding: '8px 18px',
                        borderRadius: 'var(--gt-radius-full)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        backgroundColor: isSelected ? 'var(--gt-primary)' : 'var(--gt-bg-surface)',
                        color: isSelected ? '#FFFFFF' : 'var(--gt-text-primary)',
                        border: `1.5px solid ${isSelected ? 'var(--gt-primary)' : 'var(--gt-border-subtle)'}`,
                        boxShadow: isSelected ? '0 3px 8px rgba(255, 107, 53, 0.3)' : 'none'
                      }}
                    >
                      {w}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity Selector & Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {/* Quantity Stepper */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                border: '1.5px solid var(--gt-border-default)',
                borderRadius: 'var(--gt-radius-full)',
                padding: '4px 6px',
                backgroundColor: 'var(--gt-bg-surface)'
              }}
            >
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={{ width: '32px', height: '32px', borderRadius: 'var(--gt-radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Decrease quantity"
              >
                <Minus size={16} />
              </button>
              <span style={{ minWidth: '32px', textAlign: 'center', fontWeight: 700, fontSize: '1rem' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={{ width: '32px', height: '32px', borderRadius: 'var(--gt-radius-full)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Increase quantity"
              >
                <Plus size={16} />
              </button>
            </div>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              className="gt-btn gt-btn-primary"
              style={{ flex: 1, minWidth: '160px' }}
            >
              Add to Cart • ₹{((product?.price || 0) * quantity)}
            </button>

            {/* Buy Now button */}
            <button
              onClick={handleBuyNow}
              className="gt-btn gt-btn-dark"
              style={{ padding: '12px 20px' }}
            >
              Buy Now
            </button>
          </div>

          {/* Sold by Store Snippet */}
          <div
            onClick={() => navigate('store', { storeId: product?.storeId })}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--gt-radius-lg)',
              backgroundColor: 'var(--gt-bg-card-hover)',
              border: '1px solid var(--gt-border-subtle)',
              cursor: 'pointer',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Store size={18} color="var(--gt-primary)" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Sold by {product?.storeName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gt-text-muted)' }}>
                  Hailakandi • Tap to view store
                </div>
              </div>
            </div>
            <span style={{ fontSize: '0.8125rem', color: 'var(--gt-primary)', fontWeight: 600 }}>
              Visit Store →
            </span>
          </div>

          {/* Description */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '8px' }}>
              Product Details
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--gt-text-secondary)', lineHeight: 1.6 }}>
              {product?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '16px' }}>
            You Might Also Like
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '14px'
            }}
          >
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
