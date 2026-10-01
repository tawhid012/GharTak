import React from 'react';
import { Heart, Plus, Minus } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ProductCard = ({ product }) => {
  const { navigate, cart, addToCart, updateQuantity, isFavourite, toggleFavourite } = useApp();

  if (!product) return null;

  // Find if this product is in cart
  const itemInCart = cart.find(item => item.id === product.id);
  const isInCart = Boolean(itemInCart);
  const cartQuantity = itemInCart ? itemInCart.quantity : 0;
  const isFav = isFavourite(product.id);

  const handleCardClick = () => {
    navigate('product', { productId: product.id });
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleMinusClick = (e) => {
    e.stopPropagation();
    if (itemInCart) {
      updateQuantity(itemInCart.itemKey, -1);
    }
  };

  const handlePlusClick = (e) => {
    e.stopPropagation();
    if (itemInCart) {
      updateQuantity(itemInCart.itemKey, 1);
    }
  };

  const handleFavClick = (e) => {
    e.stopPropagation();
    toggleFavourite(product.id);
  };

  return (
    <article className="gt-product-card" role="region" aria-label={product.name}>
      {/* Product Image Area */}
      <div className="gt-product-image-wrap" onClick={handleCardClick}>
        <img
          src={product.image}
          alt={product.name}
          className="gt-product-img"
          loading="lazy"
        />

        {/* Discount Badge */}
        {product.discount && (
          <span className="gt-product-discount-tag">{product.discount}</span>
        )}

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavClick}
          className={`gt-product-fav-btn ${isFav ? 'active' : ''}`}
          aria-label={isFav ? `Remove ${product.name} from favourites` : `Save ${product.name} to favourites`}
        >
          <Heart size={16} fill={isFav ? '#EF4444' : 'none'} color={isFav ? '#EF4444' : 'currentColor'} />
        </button>
      </div>

      {/* Product Content Details */}
      <div className="gt-product-content">
        <div className="gt-product-meta-row">
          <span className="gt-product-store" title={product.storeName}>
            {product.storeName}
          </span>
          {product.deliveryTime && (
            <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--gt-text-muted)' }}>
              ⚡ {product.deliveryTime}
            </span>
          )}
        </div>

        <h3
          className="gt-product-title"
          onClick={handleCardClick}
          title={product.name}
        >
          {product.name}
        </h3>

        <div className="gt-product-unit">{product.unit}</div>

        {/* Footer: Price + Add Button / Stepper */}
        <div className="gt-product-footer">
          <div className="gt-product-price-wrap">
            <span className="gt-product-price">₹{product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="gt-product-mrp">₹{product.originalPrice}</span>
            )}
          </div>

          {/* Stepper or Add Button */}
          {isInCart ? (
            <div className="gt-qty-stepper" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleMinusClick}
                className="gt-qty-btn"
                aria-label={`Decrease quantity of ${product.name}`}
              >
                <Minus size={13} />
              </button>
              <span className="gt-qty-num" aria-live="polite">{cartQuantity}</span>
              <button
                onClick={handlePlusClick}
                className="gt-qty-btn"
                aria-label={`Increase quantity of ${product.name}`}
              >
                <Plus size={13} />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddClick}
              className="gt-product-add-btn"
              aria-label={`Add ${product.name} to cart`}
            >
              ADD
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
