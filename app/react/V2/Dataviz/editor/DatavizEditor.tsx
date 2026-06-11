import React, { useState } from 'react';
import type {
  EditorTabId,
  PreviewTabId,
  DatavizDefinition,
} from '#V2/Dataviz/types/definition.js';
import { useDatavizApi } from '#V2/Dataviz/api/DatavizApiContext.js';
import { useDatavizEditorState } from './hooks/useDatavizEditorState.js';
import { useDatavizPreview } from './hooks/useDatavizPreview.js';
import { useLiveRefreshGuard } from './hooks/useLiveRefreshGuard.js';
import { DatavizEditorHeader } from './components/DatavizEditorHeader.js';
import { DatavizEditorConfigPanel } from './components/layout/DatavizEditorConfigPanel.js';
import { DatavizEditorSidebar } from './components/layout/DatavizEditorSidebar.js';
import { DatavizPreviewPanel } from './components/preview/DatavizPreviewPanel.js';

type DatavizEditorProps = {
  initialDefinition: DatavizDefinition;
};

const DatavizEditor = ({ initialDefinition }: DatavizEditorProps) => {
  const api = useDatavizApi();
  const {
    definition,
    patch,
    patchQuery,
    patchChart,
    patchAppearance,
    patchRefresh,
    replace,
  } = useDatavizEditorState(initialDefinition);
  const { data, loading, error, queryDurationMs } = useDatavizPreview(definition);
  const refreshConstraints = useLiveRefreshGuard({
    definition,
    previewData: data,
    previewError: error,
    previewQueryDurationMs: queryDurationMs,
    onPatchRefresh: patchRefresh,
  });
  const [activeTab, setActiveTab] = useState<EditorTabId>(
    definition.query.dimensions.length ? 'data' : 'basic'
  );
  const [previewTab, setPreviewTab] = useState<PreviewTabId>('preview');
  const [saving, setSaving] = useState(false);

  const previewPoints = data?.series[0]?.points;

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await api.saveDefinition(definition);
      replace(saved);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await api.deleteDefinition(definition.id);
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper text-ink">
      <DatavizEditorHeader
        definition={definition}
        saving={saving}
        onSave={handleSave}
        onDelete={handleDelete}
      />
      <div className="flex min-h-0 flex-1">
        <DatavizEditorConfigPanel
          definition={definition}
          activeTab={activeTab}
          previewPoints={previewPoints}
          refreshConstraints={refreshConstraints}
          onTabChange={setActiveTab}
          onPatch={patch}
          onPatchQuery={patchQuery}
          onPatchChart={patchChart}
          onPatchAppearance={patchAppearance}
          onPatchRefresh={patchRefresh}
        />
        <DatavizPreviewPanel
          definition={definition}
          data={data}
          loading={loading}
          error={error}
          activeTab={previewTab}
          onTabChange={setPreviewTab}
        />
        <DatavizEditorSidebar
          definition={definition}
          data={data}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
};

export { DatavizEditor };
