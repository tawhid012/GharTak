import React from 'react';
import { useApp } from '../context/AppContext';

export const CategoryCard = ({ category }) => {
  const { navigate } = useApp();

  if (!category) return null;

  const defaultImages = {
    'cat-groceries': 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80',
    'cat-dairy': 'https://images.unsplash.com/photo-1528750997573-59b89d56f4f7?auto=format&fit=crop&w=300&q=80',
    'cat-fruits-veg': 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&w=300&q=80',
    'cat-sweets-snacks': 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=300&q=80',
    'cat-meat-fish': 'https://images.unsplash.com/photo-1534482421-64566f976cfa?auto=format&fit=crop&w=300&q=80',
    'cat-pharma': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=300&q=80'
  };

  const imageSrc = category.image || category.image_url || defaultImages[category.id] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';

  return (
    <button
      onClick={() => navigate('explore', { categoryId: category.id })}
      className="gt-cat-circle"
      aria-label={`Browse ${category.name}`}
    >
      <div className="gt-cat-avatar">
        <img
          src={imageSrc}
          alt={category.name}
          className="gt-cat-circle-img"
          loading="lazy"
        />
      </div>
      <span className="gt-cat-label">{category.name}</span>
    </button>
  );
};
