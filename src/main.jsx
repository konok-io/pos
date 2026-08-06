import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Expose preloader control globally so App can control it
window.preloaderControl = {
  hide: () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.add('hidden');
      setTimeout(() => preloader.remove(), 400);
    }
  },
  show: () => {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      preloader.classList.remove('hidden');
      if (!document.body.contains(preloader)) {
        document.body.appendChild(preloader);
      }
    }
  }
};

// Simple error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    console.error('App Error:', error)
  }

  render() {
    if (this.state.hasError) {
      // Hide preloader on error
      window.preloaderControl?.hide();
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#0F766E',
          color: 'white',
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '48px' }}>⚠️</div>
            <div style={{ fontSize: '24px', marginTop: '16px' }}>কিছু সমস্যা হয়েছে</div>
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
                fontWeight: 'bold'
              }}
            >
              পুনরায় চেষ্টা করুন
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const root = createRoot(document.getElementById('root'))
root.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
)
