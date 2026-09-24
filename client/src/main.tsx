import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LanguageProvider } from './i18n';
import { initFontDetection } from './utils/fontDetect';
import { initDatabase } from './services/localDb';
import { initializeLocalData } from './services/offlineApi';
import { useAuthStore } from './store/authStore';

// Simple error boundary component
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0F766E',
          color: 'white',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <div style={{ fontSize: '24px', marginTop: '16px' }}>Something went wrong</div>
            <button
              onClick={() => window.location.reload()}
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: 'white',
                color: '#0F766E',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Dismiss HTML boot preloader as soon as React mounts (not window.load)
function dismissBootPreloader() {
  const loader = document.getElementById('preloader');
  if (!loader) return;
  loader.style.transition = 'opacity 0.3s ease';
  loader.style.opacity = '0';
  loader.style.pointerEvents = 'none';
  window.setTimeout(() => loader.remove(), 300);
}

// App wrapper that handles initialization
function AppWrapper() {
  const [isReady, setIsReady] = useState(false);
  const checkAuth = useAuthStore(state => state.checkAuth);

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize IndexedDB
        await initDatabase();
        
        // Add demo data if empty
        await initializeLocalData();
        
        // Check for existing auth
        await checkAuth();
        
        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true); // Still show app even if initialization fails
      }
    }
    
    initialize();
  }, [checkAuth]);

  // Finance-style: hide HTML boot loader only when app is ready
  useEffect(() => {
    if (isReady) {
      dismissBootPreloader();
    }
  }, [isReady]);

  if (!isReady) {
    return null; // HTML #preloader in index.html stays visible
  }

  return <App />;
}

const root = createRoot(document.getElementById('root')!);
root.render(
  <ErrorBoundary>
    <LanguageProvider>
      <AppWrapper />
    </LanguageProvider>
  </ErrorBoundary>
);

// ===== API error toast (visible alerts for silent failures) =====
(function apiErrorToast() {
  let last = '';
  window.addEventListener('pos:api-error', ((e: any) => {
    const msg = String(e.detail || '');
    if (!msg || msg === last) return;
    last = msg;
    setTimeout(() => { last = ''; }, 4000);
    const el = document.createElement('div');
    el.textContent = `⚠ ${msg}`;
    el.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99999;background:#B91C1C;color:#fff;padding:12px 18px;border-radius:10px;font-size:14px;font-weight:600;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:340px;opacity:0;transition:opacity .25s';
    document.body.appendChild(el);
    requestAnimationFrame(() => { el.style.opacity = '1'; });
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4500);
  }) as EventListener);
})();

// Initialize font detection for Bengali/English dynamic switching
initFontDetection();

// ===== Auto cache clear: detect new deploy, wipe caches, reload =====
(function autoCacheClear() {
  let reloading = false;
  const bundleName = () => {
    for (const s of Array.from(document.querySelectorAll('script[src]'))) {
      const src = s.getAttribute('src') || '';
      const m = src.match(/index-[A-Za-z0-9_-]{8,}\.js/);
      if (m) return m[0];
    }
    return '';
  };
  async function check() {
    if (reloading || !navigator.onLine) return;
    try {
      const cur = bundleName();
      if (!cur) return;
      const res = await fetch(`/?_r=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const html = await res.text();
      const m = html.match(/index-[A-Za-z0-9_-]{8,}\.js/);
      if (!m || m[0] === cur) return;
      reloading = true;
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {}
      try {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.update()));
      } catch {}
      window.location.reload();
    } catch {}
  }
  window.addEventListener('load', () => { setTimeout(check, 3000); });
  setInterval(check, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
})();
