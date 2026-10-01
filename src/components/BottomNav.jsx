import React from 'react';
import { Home, Compass, ShoppingBag, Package, User } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const BottomNav = () => {
  const { currentRoute, navigate, cartItemCount } = useApp();

  const activePage = currentRoute.page;

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'cart', label: 'Cart', icon: ShoppingBag, badge: cartItemCount },
    { id: 'orders', label: 'Orders', icon: Package },
    { id: 'profile', label: 'Profile', icon: User }
  ];

  return (
    <nav className="gt-bottom-nav" role="navigation" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = activePage === item.id;
        const badgeCount = item.badge || 0;

        return (
          <button
            key={item.id}
            onClick={() => navigate(item.id)}
            className={`gt-bottom-nav-item ${isActive ? 'active' : ''}`}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
          >
            <div className="gt-bottom-nav-icon-wrap">
              <Icon size={20} />
              {badgeCount > 0 && (
                <span className="gt-bottom-nav-badge">{badgeCount}</span>
              )}
            </div>
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
