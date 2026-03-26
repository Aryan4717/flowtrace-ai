import { useState } from 'react';
import { GraphView } from './components/GraphView';
import { ChatView } from './components/ChatView';
import { DashboardView } from './components/DashboardView';

type View = 'dashboard' | 'graph' | 'chat';

function App() {
  const [view, setView] = useState<View>('dashboard');
  const [highlightedNodeIds, setHighlightedNodeIds] = useState<string[]>([]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-brand">FlowTrace AI</h1>
        <nav className="app-nav" aria-label="Primary">
          <button
            type="button"
            className={`nav-tab ${view === 'dashboard' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button
            type="button"
            className={`nav-tab ${view === 'graph' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('graph')}
          >
            Graph
          </button>
          <button
            type="button"
            className={`nav-tab ${view === 'chat' ? 'nav-tab--active' : ''}`}
            onClick={() => setView('chat')}
          >
            Chat
          </button>
        </nav>
      </header>

      <div className="app-main">
        {view === 'dashboard' && <DashboardView />}
        {view === 'graph' && <GraphView highlightedNodeIds={highlightedNodeIds} />}
        {view === 'chat' && <ChatView onHighlight={setHighlightedNodeIds} />}
      </div>
    </div>
  );
}

export default App;
