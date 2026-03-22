import { useEffect, useState } from 'react';
import { api } from './services/api';
import { GraphView } from './components/GraphView';

type View = 'dashboard' | 'graph';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ margin: 0 }}>FlowTrace AI</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <button
            onClick={() => setView('dashboard')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'dashboard' ? '#333' : 'transparent',
              color: view === 'dashboard' ? '#fff' : '#333',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setView('graph')}
            style={{
              padding: '0.5rem 1rem',
              background: view === 'graph' ? '#333' : 'transparent',
              color: view === 'graph' ? '#fff' : '#333',
              border: '1px solid #333',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Graph
          </button>
        </nav>
      </header>

      {view === 'dashboard' && (
        <>
          {health && <p>API Status: {health.status}</p>}
          {error && <p style={{ color: 'red' }}>Error: {error}</p>}
        </>
      )}

      {view === 'graph' && <GraphView />}
    </main>
  );
}

export default App;
