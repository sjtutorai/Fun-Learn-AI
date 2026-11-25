import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  public state: State = { hasError: false, message: '' };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || 'Something unexpected happened.',
    };
  }

  public componentDidCatch(error: Error) {
    console.error('FUNLEARN AI ErrorBoundary caught:', error);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F3F7FF] p-6">
          <div className="card-toy rounded-3xl p-8 max-w-md w-full text-center space-y-4">
            <h1 className="font-display text-2xl font-bold text-slate-900">
              Oops! Our airship hit a cloud
            </h1>
            <p className="text-sm text-slate-600">
              Don’t worry—your XP and badges are safe! Tap below to get right back to your adventure.
            </p>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, message: '' });
                window.location.reload();
              }}
              className="btn-3d w-full rounded-2xl bg-blue-600 border-b-4 border-blue-800 px-6 py-3 font-display font-bold text-white"
            >
              Restart Adventure
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
