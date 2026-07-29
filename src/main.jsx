import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App.jsx'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: false,
    },
  },
})

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("React Error Boundary caught error:", error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('hitecmedia_session');
      sessionStorage.clear();
    } catch (e) {}
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100 font-outfit">
          <div className="max-w-md rounded-2xl border border-rose-500/30 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
            <h2 className="text-xl font-bold text-rose-400 mb-2">Portal Session Recovery</h2>
            <p className="text-xs text-slate-300 mb-2">
              A temporary display error occurred. Click below to refresh your session.
            </p>
            {this.state.error && (
              <pre className="text-[10px] text-rose-300 bg-black/60 p-2 rounded max-h-32 overflow-auto text-left mb-4 font-mono select-all">
                {String(this.state.error.stack || this.state.error.message || this.state.error)}
              </pre>
            )}
            <button
              onClick={this.handleReset}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all cursor-pointer"
            >
              Reset Session & Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    let refreshing = false;
    
    // Listen for the controlling service worker changing (e.g. self.skipWaiting() was called)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            // We rely on controllerchange to handle the reload safely,
            // but we can prompt the user or handle the installed state here if needed.
            // Note: skipWaiting is handled in the SW directly for immediate activation.
          });
        }
      });
    }).catch(err => console.log('SW registration failed:', err));
  });
}
