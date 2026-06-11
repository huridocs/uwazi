import React from 'react';
import type { DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import { EmbedPanel } from '../sidebar/EmbedPanel.js';
import { DetailsPanel } from '../sidebar/DetailsPanel.js';
import { StatusPanel } from '../sidebar/StatusPanel.js';

type DatavizEditorSidebarProps = {
  definition: DatavizDefinition;
  data: DatavizDataDTO | null;
  loading: boolean;
  error: string | null;
};

const DatavizEditorSidebar = ({
  definition,
  data,
  loading,
  error,
}: DatavizEditorSidebarProps) => (
  <aside className="flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-l border-border bg-parchment p-4">
    <EmbedPanel id={definition.id} />
    <DetailsPanel definition={definition} />
    <StatusPanel data={data} loading={loading} error={error} />
  </aside>
);

export { DatavizEditorSidebar };
