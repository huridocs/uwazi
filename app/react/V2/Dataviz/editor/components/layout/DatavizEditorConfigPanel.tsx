import React, { useMemo } from 'react';
import { Tabs } from '#V2/Components/UI/index.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';
import type { DatavizDefinition, EditorTabId } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import type { RefreshModeConstraints } from '#V2/Dataviz/utils/refreshModeConstraints.js';
import { InfoTab } from '../tabs/InfoTab.js';
import { DataTab } from '../tabs/DataTab.js';
import { ChartTab } from '../tabs/ChartTab.js';
import { AppearanceTab } from '../tabs/AppearanceTab.js';
import { RefreshTab } from '../tabs/RefreshTab.js';
import { t } from '#app/I18N/index.js';

type DatavizEditorConfigPanelProps = {
  definition: DatavizDefinition;
  activeTab: EditorTabId;
  nameError?: boolean;
  previewData?: DatavizDataDTO | null;
  previewLoading?: boolean;
  previewError?: string | null;
  refreshConstraints: RefreshModeConstraints & { messages: string[] };
  onTabChange: (tab: EditorTabId) => void;
  onPatch: (patch: Partial<DatavizDefinition>) => void;
  onPatchQuery: (patch: Partial<DatavizDefinition['query']>) => void;
  onPatchChart: (patch: Partial<DatavizDefinition['chart']>) => void;
  onPatchAppearance: (patch: Partial<DatavizDefinition['appearance']>) => void;
  onPatchRefresh: (patch: Partial<DatavizDefinition['refresh']>) => void;
};

const DatavizEditorConfigPanel = ({
  definition,
  activeTab,
  nameError = false,
  previewData,
  refreshConstraints,
  onTabChange,
  onPatch,
  onPatchQuery,
  onPatchChart,
  onPatchAppearance,
  onPatchRefresh,
}: DatavizEditorConfigPanelProps) => {
  const showRefreshTab = !isManualDataSource(definition.dataSource);

  const tabElements = useMemo(() => {
    const tabs = [
      <Tabs.Tab key="info" id="info" label={t('System', 'Info', null, false)}>
        <InfoTab definition={definition} nameError={nameError} onChange={onPatch} />
      </Tabs.Tab>,
      <Tabs.Tab key="data" id="data" label={t('System', 'Data', null, false)}>
        <DataTab
          definition={definition}
          onPatch={onPatch}
          onPatchQuery={onPatchQuery}
          onPatchChart={onPatchChart}
        />
      </Tabs.Tab>,
      <Tabs.Tab key="chart" id="chart" label={t('System', 'Chart', null, false)}>
        <ChartTab definition={definition} onPatchChart={onPatchChart} onPatchQuery={onPatchQuery} />
      </Tabs.Tab>,
      <Tabs.Tab key="appearance" id="appearance" label={t('System', 'Appearance', null, false)}>
        <AppearanceTab
          definition={definition}
          previewData={previewData}
          onPatchAppearance={onPatchAppearance}
        />
      </Tabs.Tab>,
    ];

    if (showRefreshTab) {
      tabs.push(
        <Tabs.Tab key="refresh" id="refresh" label={t('System', 'Refresh', null, false)}>
          <RefreshTab
            definition={definition}
            constraints={refreshConstraints}
            onPatchRefresh={onPatchRefresh}
          />
        </Tabs.Tab>
      );
    }

    return tabs;
  }, [
    definition,
    nameError,
    onPatch,
    onPatchAppearance,
    onPatchChart,
    onPatchQuery,
    onPatchRefresh,
    previewData,
    refreshConstraints,
    showRefreshTab,
  ]);

  return (
    <aside className="flex h-full min-h-0 w-[32rem] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-paper">
      <Tabs
        unmountTabs={false}
        groupId="dataviz-config"
        activeTabId={activeTab}
        onTabSelected={tabId => onTabChange(tabId as EditorTabId)}
        tabListAriaLabel={t('System', 'Dataviz editor', null, false)}
        tabListClassName="!mx-3 !mt-3 !mb-0"
        className="min-h-0 flex-1"
      >
        {tabElements}
      </Tabs>
    </aside>
  );
};

export { DatavizEditorConfigPanel };
