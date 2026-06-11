import React from 'react';
import {
  AdjustmentsHorizontalIcon,
  ChartBarIcon,
  CircleStackIcon,
  PaintBrushIcon,
  ArrowPathIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import type { EditorTabId } from '#V2/Dataviz/types/definition.js';

const TABS: { id: EditorTabId; label: string; icon: React.ComponentType<{ className?: string }> }[] =
  [
    { id: 'basic', label: 'Basic', icon: DocumentTextIcon },
    { id: 'data', label: 'Data', icon: CircleStackIcon },
    { id: 'chart', label: 'Chart', icon: ChartBarIcon },
    { id: 'appearance', label: 'Appearance', icon: PaintBrushIcon },
    { id: 'refresh', label: 'Refresh', icon: ArrowPathIcon },
  ];

type DatavizIconNavProps = {
  activeTab: EditorTabId;
  onTabChange: (tab: EditorTabId) => void;
};

const DatavizIconNav = ({ activeTab, onTabChange }: DatavizIconNavProps) => (
  <nav className="flex w-16 shrink-0 flex-col gap-1 border-r border-border bg-parchment py-3">
    {TABS.map(tab => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      return (
        <button
          key={tab.id}
          type="button"
          title={tab.label}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 px-2 py-2 text-[10px] ${
            isActive
              ? 'bg-warm text-ink'
              : 'text-ink-secondary hover:bg-warm/60 hover:text-ink'
          }`}
        >
          <Icon className="h-5 w-5" />
          <span>{tab.label}</span>
        </button>
      );
    })}
    <div className="mt-auto flex justify-center pb-2">
      <AdjustmentsHorizontalIcon className="h-4 w-4 text-ink-muted" />
    </div>
  </nav>
);

export { DatavizIconNav };
