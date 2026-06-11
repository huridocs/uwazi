import React from 'react';
import type { DatavizDefinition, EditorTabId } from '#V2/Dataviz/types/definition.js';
import type { DataPoint } from '#V2/Dataviz/types/data.js';
import type { RefreshModeConstraints } from '#V2/Dataviz/utils/refreshModeConstraints.js';
import { DatavizIconNav } from '../DatavizIconNav.js';
import { BasicTab } from '../tabs/BasicTab.js';
import { DataTab } from '../tabs/DataTab.js';
import { ChartTab } from '../tabs/ChartTab.js';
import { AppearanceTab } from '../tabs/AppearanceTab.js';
import { RefreshTab } from '../tabs/RefreshTab.js';

type DatavizEditorConfigPanelProps = {
  definition: DatavizDefinition;
  activeTab: EditorTabId;
  previewPoints?: DataPoint[];
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
  previewPoints,
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
      case 'basic':
        return <BasicTab definition={definition} onChange={onPatch} />;
      case 'data':
        return (
          <DataTab
            definition={definition}
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
            previewPoints={previewPoints}
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
    <>
      <DatavizIconNav activeTab={activeTab} onTabChange={onTabChange} />
      <aside className="w-80 shrink-0 overflow-y-auto border-r border-border bg-paper">
        {renderTab()}
      </aside>
    </>
  );
};

export { DatavizEditorConfigPanel };
