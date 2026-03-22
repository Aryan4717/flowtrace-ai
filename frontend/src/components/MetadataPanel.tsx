import type { EntityWithType } from '../types';

interface MetadataPanelProps {
  entity: EntityWithType | null;
  error: string | null;
  loading: boolean;
  onExpandNeighbors: () => void;
  expandDisabled?: boolean;
}

export function MetadataPanel({
  entity,
  error,
  loading,
  onExpandNeighbors,
  expandDisabled = false,
}: MetadataPanelProps) {
  if (loading) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: 8,
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Loading...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#fee',
          borderRadius: 8,
          color: '#c00',
        }}
      >
        {error}
      </div>
    );
  }

  if (!entity) {
    return (
      <div
        style={{
          padding: '1rem',
          background: '#f5f5f5',
          borderRadius: 8,
          color: '#666',
        }}
      >
        Click a node to view metadata
      </div>
    );
  }

  const { type, entity: data } = entity;

  return (
    <div
      style={{
        padding: '1rem',
        background: '#f5f5f5',
        borderRadius: 8,
        fontFamily: 'monospace',
        fontSize: 13,
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: '#333' }}>
        {type} - {data.id as string}
      </div>
      <div style={{ marginBottom: '1rem' }}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} style={{ marginBottom: '0.25rem' }}>
            <span style={{ color: '#666' }}>{key}:</span> {String(val)}
          </div>
        ))}
      </div>
      <button
        onClick={onExpandNeighbors}
        disabled={expandDisabled}
        style={{
          padding: '0.5rem 1rem',
          background: expandDisabled ? '#ccc' : '#333',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: expandDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        Expand neighbors
      </button>
    </div>
  );
}
