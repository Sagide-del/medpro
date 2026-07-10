import { Component } from 'react';
import { Link } from 'react-router-dom';

/**
 * Contains a crash to whatever it wraps instead of letting it wipe the
 * entire React tree (which is what was happening before — one broken page
 * took the sidebar and "Back to home" button down with it, since React
 * unmounts everything up to the nearest error boundary, or the whole app if
 * there isn't one).
 *
 * Usage: wrap page content, not the sidebar/nav around it, so navigation
 * stays usable even if the page itself throws. In Layout.jsx this wraps
 * <Outlet/> and is keyed on the route path so navigating to a different
 * page automatically clears a previous error.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Caught a render error:', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card" style={{ maxWidth: 560, margin: '40px auto' }}>
          <h2>Something went wrong loading this page</h2>
          <p style={{ color: 'var(--ink-soft)', marginBottom: 16 }}>
            {this.state.error?.message || 'An unexpected error occurred.'} The rest of the app is
            still working — you can try again or head back home.
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => this.setState({ error: null })}>Try again</button>
            {this.props.homeLink !== false && (
              <Link to="/"><button className="ghost">Back to home</button></Link>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
