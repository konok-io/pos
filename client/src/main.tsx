import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { LanguageProvider } from './i18n';
import { initFontDetection } from './utils/fontDetect';
import { initDatabase } from './services/localDb';

// Loading screen component

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

// App wrapper that handles initialization
function AppWrapper() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function initialize() {
      try {
        // Initialize data
        await initDatabase();
        

        


        
        setIsReady(true);
      } catch (error) {
        console.error('Initialization error:', error);
        setIsReady(true); // Still show app even if initialization fails
      }
    }
    
    initialize();
  }, []);

  if (!isReady) {
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

// Initialize font detection for Bengali/English dynamic switching
initFontDetection();
