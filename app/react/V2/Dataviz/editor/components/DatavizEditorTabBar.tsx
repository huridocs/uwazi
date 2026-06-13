import React, { useMemo } from 'react';
import type { DatavizDataSourceKind, EditorTabId } from '#V2/Dataviz/types/definition.js';
import { isManualDataSource } from '#shared/dataviz/manualData.js';

const TABS: { id: EditorTabId; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'data', label: 'Data' },
  { id: 'chart', label: 'Chart' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'refresh', label: 'Refresh' },
];

type DatavizEditorTabBarProps = {
  activeTab: EditorTabId;
  dataSource?: DatavizDataSourceKind;
  onTabChange: (tab: EditorTabId) => void;
};

const DatavizEditorTabBar = ({ activeTab, dataSource, onTabChange }: DatavizEditorTabBarProps) => {
  const visibleTabs = useMemo(
    () => TABS.filter(tab => !(tab.id === 'refresh' && isManualDataSource(dataSource))),
    [dataSource]
  );

  return (
  <div className="flex flex-nowrap gap-1 border-b border-border bg-paper px-3 py-2">
    {visibleTabs.map(tab => {
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          className={`shrink-0 rounded-md px-2.5 py-1.5 text-sm ${
            isActive
              ? 'bg-warm font-medium text-ink'
              : 'text-ink-secondary hover:bg-vellum hover:text-ink'
          }`}
        >
          {tab.label}
        </button>
      );
    })}
  </div>
  );
};

export { DatavizEditorTabBar };
