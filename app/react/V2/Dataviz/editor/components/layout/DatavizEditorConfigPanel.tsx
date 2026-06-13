import React from 'react';
import type { DatavizDefinition, EditorTabId } from '#V2/Dataviz/types/definition.js';
import type { DatavizDataDTO } from '#V2/Dataviz/types/data.js';
import type { RefreshModeConstraints } from '#V2/Dataviz/utils/refreshModeConstraints.js';
import { DatavizEditorTabBar } from '../DatavizEditorTabBar.js';
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
  previewLoading = false,
  previewError = null,
  refreshConstraints,
  onTabChange,
  onPatch,
  onPatchQuery,
  onPatchChart,
  onPatchAppearance,
  onPatchRefresh,
}: DatavizEditorConfigPanelProps) => {
  const renderTab = () => {
    switch (activeTab) {
      case 'info':
        return <InfoTab definition={definition} onChange={onPatch} />;
      case 'data':
        return (
          <DataTab
            definition={definition}
            onPatch={onPatch}
            onPatchQuery={onPatchQuery}
            onPatchChart={onPatchChart}
          />
        );
      case 'chart':
        return <ChartTab definition={definition} onPatchChart={onPatchChart} />;
      case 'appearance':
        return (
          <AppearanceTab
            definition={definition}
            previewData={previewData}
            onPatchAppearance={onPatchAppearance}
          />
        );
      case 'refresh':
        return (
          <RefreshTab
            definition={definition}
            constraints={refreshConstraints}
            onPatchRefresh={onPatchRefresh}
          />
        );
      default:
        return null;
    }
  };

  return (
    <aside className="flex h-full min-h-0 w-[32rem] shrink-0 flex-col border-r border-border bg-paper">
      <DatavizEditorTabBar
        activeTab={activeTab}
        dataSource={definition.dataSource}
        onTabChange={onTabChange}
      />
      <div className="min-h-0 flex-1 overflow-y-auto bg-paper">{renderTab()}</div>
    </aside>
  );
};

export { DatavizEditorConfigPanel };
