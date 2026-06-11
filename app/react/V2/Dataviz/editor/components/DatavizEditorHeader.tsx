import React from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Button } from '#V2/Components/UI/Button.js';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';

type DatavizEditorHeaderProps = {
  definition: DatavizDefinition;
  saving?: boolean;
  onSave: () => void;
  onDelete: () => void;
};

const DatavizEditorHeader = ({
  definition,
  saving,
  onSave,
  onDelete,
}: DatavizEditorHeaderProps) => (
  <header className="flex items-center justify-between gap-4 border-b border-border bg-parchment px-4 py-3">
    <div className="flex min-w-0 items-center gap-3">
      <button
        type="button"
        className="flex items-center gap-1 text-sm text-ink-secondary hover:text-ink"
        aria-label="Back to data visualizations"
      >
        <ChevronLeftIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Back to data visualizations</span>
      </button>
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-ink">{definition.name}</h1>
        {definition.description && (
          <p className="truncate text-sm text-ink-secondary">{definition.description}</p>
        )}
      </div>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <Button type="button" variant="ghost" size="small" onClick={onDelete}>
        Delete
      </Button>
      <Button type="button" variant="primary" size="small" onClick={onSave} disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </div>
  </header>
);

export { DatavizEditorHeader };
