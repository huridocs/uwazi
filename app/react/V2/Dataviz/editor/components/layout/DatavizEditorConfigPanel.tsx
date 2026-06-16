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

type DatavizEditorConfigPanelProps = {
  definition: DatavizDefinition;
  activeTab: EditorTabId;
  previewData?: DatavizDataDTO | null;
  previewLoading?: boolean;
  previewError?: string | null;
  refreshConstraints: RefreshModeConstraints;
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
      <Tabs.Tab key="info" id="info" label="Info">
        <InfoTab definition={definition} onChange={onPatch} />
      </Tabs.Tab>,
      <Tabs.Tab key="data" id="data" label="Data">
        <DataTab
          definition={definition}
          onPatch={onPatch}
          onPatchQuery={onPatchQuery}
          onPatchChart={onPatchChart}
        />
      </Tabs.Tab>,
      <Tabs.Tab key="chart" id="chart" label="Chart">
        <ChartTab
          definition={definition}
          onPatchChart={onPatchChart}
          onPatchQuery={onPatchQuery}
        />
      </Tabs.Tab>,
      <Tabs.Tab key="appearance" id="appearance" label="Appearance">
        <AppearanceTab
          definition={definition}
          previewData={previewData}
          onPatchAppearance={onPatchAppearance}
        />
      </Tabs.Tab>,
    ];

    if (showRefreshTab) {
      tabs.push(
        <Tabs.Tab key="refresh" id="refresh" label="Refresh">
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
        domIdPrefix="dataviz-config"
        initialTabId={activeTab}
        onTabSelected={tabId => onTabChange(tabId as EditorTabId)}
        tabListAriaLabel="Dataviz editor"
        tabListClassName="!mx-3 !mt-3 !mb-0"
        className="min-h-0 flex-1"
      >
        {tabElements}
      </Tabs>
    </aside>
  );
};

export { DatavizEditorConfigPanel };
