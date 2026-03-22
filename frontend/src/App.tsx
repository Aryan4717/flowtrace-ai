import { useEffect, useState } from 'react';
import { api } from './services/api';

function App() {
  const [health, setHealth] = useState<{ status: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .get('/health')
      .then((res) => setHealth(res.data))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <main style={{ padding: '2rem' }}>
      <h1>FlowTrace AI</h1>
      {health && <p>API Status: {health.status}</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
    </main>
  );
}

export default App;
