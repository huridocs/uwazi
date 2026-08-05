import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { t, Translate } from '#app/I18N/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button } from '#V2/Components/UI/Button.js';
import type { EditorTabId, PreviewTabId, DatavizDefinition } from '#V2/Dataviz/types/definition.js';
import { useDatavizApi } from '#V2/Dataviz/api/DatavizApiContext.js';
import { isPersistedId } from '#V2/Dataviz/api/httpDatavizApi.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { useDatavizEditorState } from './hooks/useDatavizEditorState.js';
import { normalizeLegacyDefinition } from '#V2/Dataviz/utils/normalizeLegacyDefinition.js';
import { useDatavizPreview } from './hooks/useDatavizPreview.js';
import { useLiveRefreshGuard } from './hooks/useLiveRefreshGuard.js';
import { DatavizEditorConfigPanel } from './components/layout/DatavizEditorConfigPanel.js';
import { DatavizPreviewPanel } from './components/preview/DatavizPreviewPanel.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import { isEchartsChartType } from '#V2/Dataviz/types/chartTypes.js';

type DatavizEditorProps = {
  initialDefinition: DatavizDefinition;
  onDeleteRequest?: () => void;
};

const DatavizEditor = ({ initialDefinition, onDeleteRequest }: DatavizEditorProps) => {
  const api = useDatavizApi();
  const navigate = useNavigate();
  const { notify } = useRequestStatus();
  const normalizedInitial = normalizeLegacyDefinition(initialDefinition);
  const { definition, patch, patchQuery, patchChart, patchAppearance, patchRefresh, replace } =
    useDatavizEditorState(normalizedInitial);
  const { data, loading, error, queryDurationMs } = useDatavizPreview(definition);
  const refreshConstraints = useLiveRefreshGuard({
    definition,
    previewData: data,
    previewError: error,
    previewQueryDurationMs: queryDurationMs,
    onPatchRefresh: patchRefresh,
  });
  const [activeTab, setActiveTab] = useState<EditorTabId>(
    definition.query.dimensions.length ? 'data' : 'info'
  );
  const [previewTab, setPreviewTab] = useState<PreviewTabId>('preview');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isManualDataSource(definition.dataSource)) {
      if (activeTab === 'refresh') {
        setActiveTab('data');
      }
      if (previewTab === 'query') {
        setPreviewTab('preview');
      }
    }
    if (!isEchartsChartType(definition.chart.type) && previewTab === 'advanced') {
      setPreviewTab('preview');
    }
  }, [definition.dataSource, definition.chart.type, activeTab, previewTab]);

  const breadcrumbPath = useMemo(() => new Map([['Data visualizations', '/settings/dataviz']]), []);

  const handleSave = async () => {
    setSaving(true);
    const isFirstSave = !isPersistedId(definition.id);
    try {
      const saved = await api.saveDefinition(definition);
      replace(saved);
      if (isFirstSave) {
        await navigate(`/settings/dataviz/edit/${saved.id}`, { replace: true });
      }
      notify('success', t('System', 'Saved successfully.', null, false));
    } catch {
      notify('error', t('System', 'An error occurred', null, false));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (onDeleteRequest) {
      onDeleteRequest();
      return;
    }
    api.deleteDefinition(definition.id).catch(() => {
      notify('error', t('System', 'An error occurred', null, false));
    });
  };

  return (
    <div className="tw-content flex h-full min-h-0 w-full flex-1 flex-col">
      <SettingsContent className="flex h-full min-h-0 flex-1 flex-col">
        <SettingsContent.Header
          path={breadcrumbPath}
          title={definition.name || 'Untitled visualization'}
        />

        <SettingsContent.Body className="!bg-paper flex min-h-0 flex-1 flex-col !px-0">
          <div className="flex min-h-0 flex-1 w-full gap-3 bg-parchment p-3">
            <DatavizEditorConfigPanel
              definition={definition}
              activeTab={activeTab}
              previewData={data}
              previewLoading={loading}
              previewError={error}
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
              onPatchChart={patchChart}
            />
          </div>
        </SettingsContent.Body>

        <SettingsContent.Footer>
          <div className="flex flex-wrap justify-end gap-2">
            <Link to="/settings/dataviz">
              <Button variant="ghost" disabled={saving}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>
            {isPersistedId(definition.id) && (
              <Button
                type="button"
                variant="danger"
                size="small"
                onClick={handleDelete}
                disabled={saving}
              >
                <Translate>Delete</Translate>
              </Button>
            )}
            <Button type="button" variant="success" onClick={handleSave} disabled={saving}>
              {saving ? <Translate>Saving</Translate> : <Translate>Save</Translate>}
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>
    </div>
  );
};

export { DatavizEditor };
