import { useEffect, useState } from 'react';
import POS from './pages/POS';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { offlineSync } from './services/offlineSync';
import { useAuthStore, useCurrencyStore } from './store/authStore';
import { productApi, categoryApi, currencyApi, storeApi } from './services/api';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<'pos' | 'dashboard'>('pos');
  const { isAuthenticated, setAuth } = useAuthStore();
  const { setCurrencies } = useCurrencyStore();

  useEffect(() => {
    initializeApp();
  }, []);

  async function initializeApp() {
    try {
      // Initialize offline DB
      await offlineSync.init();

      // Try to authenticate with demo credentials
      const response = await productApi.list();
      if (response.success && response.data) {
        // Set demo auth
        setAuth(
          { id: 'demo', name: 'Admin', email: 'admin@pos.test', role: 'admin' },
          { id: 'demo-store', name: 'Demo Store', code: 'DEMO', isActive: true, invoicePrefix: 'INV' },
          'demo_token'
        );

        // Load currencies
        const currencyRes = await currencyApi.list();
        if (currencyRes.success && currencyRes.data) {
          setCurrencies(currencyRes.data);
        }
      }
    } catch (error) {
      console.error('Init error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💼</div>
          <div className="text-xl">লোড হচ্ছে...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {currentPage === 'pos' ? (
        <POS onNavigate={setCurrentPage} />
      ) : (
        <Dashboard onNavigate={setCurrentPage} />
      )}
    </div>
  );
}

export default App;
