'use client';

import { Component } from 'react';
import ErrorMessage from './ErrorMessage';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#191919] flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorMessage
              message="Something went wrong. Please refresh the page."
              onDismiss={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              autoDismiss={false}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

