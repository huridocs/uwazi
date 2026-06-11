import React from 'react';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';

type StatusPanelProps = {
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
};

const StatusPanel = ({ data, loading, error }: StatusPanelProps) => {
  let status: 'ok' | 'loading' | 'stale' | 'error' = 'ok';
  let message = 'Data is up to date';

  if (loading) {
    status = 'loading';
    message = 'Refreshing preview…';
  } else if (error) {
    status = 'error';
    message = error;
  } else if (data?.stale) {
    status = 'stale';
    message = 'Data may be stale';
  }

  const dotColor = {
    ok: 'bg-green-500',
    loading: 'bg-amber-500',
    stale: 'bg-amber-500',
    error: 'bg-red-500',
  }[status];

  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-ink">Status</h3>
      <div className="flex items-center gap-2 text-sm text-ink-secondary">
        <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
        <span>{message}</span>
      </div>
      {data?.meta?.queryDurationMs != null && !loading && !error && (
        <p className="text-xs text-ink-muted">Query took {data.meta.queryDurationMs}ms</p>
      )}
    </section>
  );
};

export { StatusPanel };
