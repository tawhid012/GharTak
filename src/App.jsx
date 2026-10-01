import React from 'react';
import { useApp } from './context/AppContext';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { LocationModal } from './components/LocationModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import { AuthModal } from './components/AuthModal';
import { Toast } from './components/Toast';
import { Footer } from './components/Footer';

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { SearchPage } from './pages/SearchPage';
import { StorePage } from './pages/StorePage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrdersPage } from './pages/OrdersPage';
import { ProfilePage } from './pages/ProfilePage';
import { SavedPage } from './pages/SavedPage';

// Auth & Partner Pages
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VendorRegisterPage } from './pages/VendorRegisterPage';
import { RiderRegisterPage } from './pages/RiderRegisterPage';
import { VendorDashboardPage } from './pages/VendorDashboardPage';
import { RiderDashboardPage } from './pages/RiderDashboardPage';
import { AdminPage } from './pages/AdminPage';

export const App = () => {
  const { currentRoute } = useApp();

  const isPartnerOrAdmin = [
    'vendor-dashboard',
    'rider-dashboard',
    'admin',
    'admin-dashboard'
  ].includes(currentRoute.page);

  const renderActivePage = () => {
    switch (currentRoute.page) {
      case 'home':
        return <HomePage />;
      case 'explore':
        return <ExplorePage />;
      case 'search':
        return <SearchPage />;
      case 'store':
        return <StorePage />;
      case 'product':
        return <ProductDetailPage />;
      case 'cart':
        return <CartPage />;
      case 'checkout':
        return <CheckoutPage />;
      case 'order-confirmation':
        return <OrderConfirmationPage />;
      case 'order-tracking':
        return <OrderTrackingPage />;
      case 'orders':
        return <OrdersPage />;
      case 'profile':
        return <ProfilePage />;
      case 'saved':
        return <SavedPage />;
      case 'login':
        return <LoginPage />;
      case 'register':
        return <RegisterPage />;
      case 'vendor-register':
        return <VendorRegisterPage />;
      case 'rider-register':
        return <RiderRegisterPage />;
      case 'vendor-dashboard':
        return <VendorDashboardPage />;
      case 'rider-dashboard':
        return <RiderDashboardPage />;
      case 'admin':
      case 'admin-dashboard':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <div className="gt-app">
      {/* Global Toast */}
      <Toast />

      {/* Main Header (Rendered on standard pages) */}
      <Header />

      {/* Dynamic Page Content */}
      <main className="gt-main-content animate-fade-in" role="main">
        {renderActivePage()}
      </main>

      {/* Footer */}
      {!isPartnerOrAdmin && <Footer />}

      {/* Mobile Sticky Bottom Navigation for consumers */}
      {!isPartnerOrAdmin && <BottomNav />}

      {/* Global Modals & Drawers */}
      <LocationModal />
      <NotificationDrawer />
      <AuthModal />
    </div>
  );
};
export default App;
