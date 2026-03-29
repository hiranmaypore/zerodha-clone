import { Component } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home, Copy, CheckCircle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReload = () => window.location.reload();
  handleGoHome = () => { window.location.href = '/dashboard'; };
  handleCopyError = () => {
    const errorText = `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}\n\nComponent: ${this.state.errorInfo?.componentStack}`;
    navigator.clipboard.writeText(errorText).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-dark flex items-center justify-center p-6">
          <div className="max-w-lg w-full text-center space-y-8">
            {/* Animated icon */}
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-3xl bg-loss/10 border border-loss/20 flex items-center justify-center mx-auto animate-pulse">
                <AlertTriangle className="w-12 h-12 text-loss" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-loss rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-black">!</span>
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl font-black text-primary tracking-tight">Something Went Wrong</h1>
              <p className="text-muted text-sm max-w-sm mx-auto leading-relaxed">
                The application encountered an unexpected error. Your data is safe — this is just a rendering issue.
              </p>
            </div>

            {/* Error details (collapsible) */}
            <details className="text-left bg-surface/50 border border-edge rounded-2xl overflow-hidden">
              <summary className="px-5 py-3 text-xs font-bold text-muted uppercase tracking-wider cursor-pointer hover:bg-surface/80 transition-colors flex items-center gap-2">
                <Bug className="w-3.5 h-3.5" /> Technical Details
              </summary>
              <div className="px-5 py-4 border-t border-edge">
                <pre className="text-[11px] text-loss/80 font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto scrollbar-hide">
                  {this.state.error?.message}
                </pre>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-[10px] text-muted font-mono whitespace-pre-wrap break-all mt-3 max-h-32 overflow-y-auto scrollbar-hide opacity-60">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </div>
            </details>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-accent text-white font-bold rounded-2xl shadow-lg shadow-accent/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <RefreshCw className="w-4 h-4" /> Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface border border-edge text-primary font-bold rounded-2xl hover:bg-surface/80 transition-all"
              >
                <Home className="w-4 h-4" /> Go to Dashboard
              </button>
              <button
                onClick={this.handleCopyError}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-surface border border-edge text-primary font-bold rounded-2xl hover:bg-surface/80 transition-all"
              >
                {this.state.copied ? <CheckCircle className="w-4 h-4 text-profit" /> : <Copy className="w-4 h-4" />}
                {this.state.copied ? 'Copied!' : 'Copy Error'}
              </button>
            </div>

            <p className="text-[10px] text-muted/50 uppercase tracking-widest font-bold">
              Zerodha Clone · Error Recovery System
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
