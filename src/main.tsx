import {StrictMode, Component} from 'react';
import type {ReactNode, ErrorInfo} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n/config';

import { registerSW } from 'virtual:pwa-register';

// Register service worker using vite-plugin-pwa
registerSW({ immediate: true });

// ── Error Boundary ────────────────────────────────────────────────────────────
class ErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{padding:'2rem',fontFamily:'monospace',background:'#fff1f2',color:'#9f1239',minHeight:'100vh'}}>
          <h2 style={{marginBottom:'1rem'}}>⚠️ Application Error</h2>
          <pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',fontSize:'0.85rem'}}>
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
