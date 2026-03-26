import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../services/api';

type HealthResponse = { status: string };

export type DashboardStats = {
  customers: number;
  orders: number;
  deliveries: number;
  invoices: number;
  payments: number;
  products: number;
};

type LoadState = 'idle' | 'loading' | 'success' | 'error';

function formatUpdatedLabel(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function buildInsights(stats: DashboardStats | null): { headline: string; body: string; confidence: string } {
  if (!stats) {
    return {
      headline: 'Waiting for data',
      body: 'Connect to the API and load operational stats to generate FlowTrace insights.',
      confidence: 'Not yet analyzed',
    };
  }

  const total =
    stats.customers +
    stats.orders +
    stats.deliveries +
    stats.invoices +
    stats.payments +
    stats.products;

  if (total === 0) {
    return {
      headline: 'Ingestion pipeline is empty',
      body:
        'No customers, orders, or invoices are in the in-memory store yet. Run your ingestion flow or seed data so FlowTrace can surface O2C quality and link coverage.',
      confidence: 'High · dataset empty',
    };
  }

  const unpaidHint =
    stats.invoices > stats.payments
      ? ` There are ${stats.invoices} invoices and ${stats.payments} payments recorded—investigate gaps in the graph or via Chat.`
      : '';

  return {
    headline: 'Order-to-cash graph is active',
    body: `FlowTrace is tracking ${stats.customers.toLocaleString()} customers across ${stats.orders.toLocaleString()} orders, ${stats.deliveries.toLocaleString()} deliveries, ${stats.invoices.toLocaleString()} invoices, and ${stats.payments.toLocaleString()} payments.${unpaidHint}`,
    confidence: 'Medium · heuristic summary from store counts',
  };
}

function buildActions(stats: DashboardStats | null): { id: string; title: string; detail: string; primary?: boolean }[] {
  const actions: { id: string; title: string; detail: string; primary?: boolean }[] = [];

  if (!stats || stats.customers + stats.orders === 0) {
    actions.push({
      id: 'ingest',
      title: 'Run or verify data ingestion',
      detail: 'Populate the store with customers and orders so links and traces are meaningful.',
      primary: true,
    });
  }

  if (stats && stats.orders > 0) {
    actions.push({
      id: 'links',
      title: 'Review delivery → order links',
      detail: 'Unresolved edges reduce trace confidence; use Graph or Chat to spot gaps.',
      primary: !actions.length,
    });
  }

  if (stats && stats.invoices > stats.payments) {
    actions.push({
      id: 'unpaid',
      title: 'Investigate invoice vs payment coverage',
      detail: 'Compare invoice and payment nodes for aging exposure.',
      primary: !actions.length,
    });
  }

  actions.push({
    id: 'chat',
    title: 'Ask FlowTrace in Chat',
    detail: 'Natural language queries can surface cross-entity paths and anomalies.',
    primary: actions.length === 0,
  });

  return actions.slice(0, 4);
}

export function DashboardView() {
  const [healthState, setHealthState] = useState<LoadState>('idle');
  const [statsState, setStatsState] = useState<LoadState>('idle');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    setHealthState('loading');
    setStatsState('loading');
    setHealthError(null);
    setStatsError(null);

    const healthPromise = api.get<HealthResponse>('/health').catch((err: Error) => {
      setHealthError(err.message || 'Health check failed');
      return null;
    });

    const statsPromise = api.get<DashboardStats>('/stats').catch((err: Error) => {
      setStatsError(err.message || 'Stats unavailable');
      return null;
    });

    const [hRes, sRes] = await Promise.all([healthPromise, statsPromise]);

    if (hRes) {
      setHealth(hRes.data);
      setHealthState('success');
    } else {
      setHealth(null);
      setHealthState('error');
    }

    if (sRes) {
      setStats(sRes.data);
      setStatsState('success');
    } else {
      setStats(null);
      setStatsState('error');
    }

    setLastUpdated(new Date());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const insights = useMemo(() => {
    if (statsState === 'error') {
      return {
        headline: 'Store statistics unavailable',
        body:
          'The dashboard could not load /stats. Check that the API is running and that the stats route is deployed. Health and graph views may still work.',
        confidence: 'Not computed',
      };
    }
    return buildInsights(statsState === 'success' ? stats : null);
  }, [stats, statsState]);
  const actions = useMemo(() => buildActions(statsState === 'success' ? stats : null), [stats, statsState]);

  const loading = healthState === 'loading' || statsState === 'loading';

  return (
    <div className="dashboard">
      <div className="dashboard-grid">
        <section className="dashboard-hero card card--elevated" aria-labelledby="ai-insights-heading">
          <div className="card__eyebrow">AI insights</div>
          <h2 id="ai-insights-heading" className="card__title">
            {loading ? 'Analyzing operational context…' : insights.headline}
          </h2>
          {loading && (
            <p className="card__muted dashboard-skeleton" role="status">
              Loading health and store statistics…
            </p>
          )}
          {!loading && statsState === 'error' && (
            <p className="card__error" role="alert">
              Could not load stats.{statsError ? ` ${statsError}` : ''} Operational KPIs and narrative may be incomplete.
            </p>
          )}
          {!loading && (
            <p className="card__body">{insights.body}</p>
          )}
          <div className="card__meta">
            <span className={`badge ${loading ? 'badge--muted' : 'badge--neutral'}`}>{insights.confidence}</span>
            {lastUpdated && (
              <span className="card__muted">Updated {formatUpdatedLabel(lastUpdated)}</span>
            )}
          </div>
          <div className="dashboard-hero__actions">
            <button type="button" className="btn btn--primary" onClick={() => void load()} disabled={loading}>
              Refresh insights
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => void load()} disabled={loading}>
              Re-sync data
            </button>
          </div>
        </section>

        <aside className="dashboard-sidebar">
          <section className="card" aria-labelledby="actions-heading">
            <div className="card__eyebrow">Recommended actions</div>
            <h2 id="actions-heading" className="card__title card__title--sm">
              Next steps
            </h2>
            <ul className="action-list">
              {loading &&
                [1, 2, 3].map((i) => (
                  <li key={i} className="action-list__item action-list__item--ghost">
                    <span className="dashboard-skeleton">Loading…</span>
                  </li>
                ))}
              {!loading &&
                actions.map((a) => (
                  <li key={a.id} className={`action-list__item ${a.primary ? 'action-list__item--primary' : ''}`}>
                    <strong>{a.title}</strong>
                    <span className="action-list__detail">{a.detail}</span>
                  </li>
                ))}
            </ul>
          </section>

          <section className="card" aria-labelledby="system-heading">
            <div className="card__eyebrow">System / sync</div>
            <h2 id="system-heading" className="card__title card__title--sm">
              API & freshness
            </h2>
            {healthState === 'loading' && <p className="card__muted">Checking API…</p>}
            {healthState === 'error' && (
              <p className="card__error" role="alert">
                API unreachable.{healthError ? ` ${healthError}` : ''}
              </p>
            )}
            {healthState === 'success' && health && (
              <p className="system-row">
                <span className="system-row__label">API</span>
                <span className={`badge ${health.status === 'ok' ? 'badge--success' : 'badge--warning'}`}>
                  {health.status}
                </span>
              </p>
            )}
            {lastUpdated && (
              <p className="card__muted system-freshness">Last checked {formatUpdatedLabel(lastUpdated)}</p>
            )}
          </section>
        </aside>
      </div>

      <section className="card dashboard-kpis" aria-labelledby="kpi-heading">
        <div className="card__eyebrow">Operational summary</div>
        <h2 id="kpi-heading" className="card__title card__title--sm">
          In-memory store (KPIs)
        </h2>
        {statsState === 'loading' && (
          <div className="kpi-grid" aria-busy="true">
            {['Customers', 'Orders', 'Deliveries', 'Invoices', 'Payments', 'Products'].map((label) => (
              <div key={label} className="kpi-card kpi-card--loading">
                <span className="kpi-card__label">{label}</span>
                <span className="kpi-card__value dashboard-skeleton">—</span>
              </div>
            ))}
          </div>
        )}
        {statsState === 'error' && (
          <p className="card__error" role="alert">
            KPIs unavailable.{statsError ? ` ${statsError}` : ''}
          </p>
        )}
        {statsState === 'success' && stats && (
          <div className="kpi-grid">
            <div className="kpi-card">
              <span className="kpi-card__label">Customers</span>
              <span className="kpi-card__value">{stats.customers.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label">Orders</span>
              <span className="kpi-card__value">{stats.orders.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label">Deliveries</span>
              <span className="kpi-card__value">{stats.deliveries.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label">Invoices</span>
              <span className="kpi-card__value">{stats.invoices.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label">Payments</span>
              <span className="kpi-card__value">{stats.payments.toLocaleString()}</span>
            </div>
            <div className="kpi-card">
              <span className="kpi-card__label">Products</span>
              <span className="kpi-card__value">{stats.products.toLocaleString()}</span>
            </div>
          </div>
        )}
        {statsState === 'success' && stats && stats.customers + stats.orders + stats.invoices === 0 && (
          <p className="card__muted kpi-empty">Empty store — ingestion will populate these counts.</p>
        )}
      </section>
    </div>
  );
}
