import React, { useMemo, useRef, useState } from 'react';
import { TabsButtons } from './TabsButtons';

type TabItem = {
  id: string;
  label: string;
  count?: number;
  controls: string;
  content: React.ReactNode;
  icon: React.ReactNode;
  disabled?: boolean;
};

interface TabsProps {
  tabs: TabItem[];
  defaultActiveId?: string;
  activeId?: string;
  className?: string;
  onTabSelected?: (activeId: string) => void;
}

const Tabs: React.FC<TabsProps> = ({
  tabs,
  defaultActiveId,
  activeId,
  className = '',
  onTabSelected,
}) => {
  const firstEnabled = useMemo(() => tabs.find(t => !t.disabled)?.id, [tabs]);
  const [internalActiveId, setInternalActiveId] = useState<string>(
    defaultActiveId || firstEnabled || tabs[0].id
  );
  const panelRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const currentActiveId = activeId !== undefined ? activeId : internalActiveId;

  const onClick = (id: string) => {
    const tab = tabs.find(t => t.id === id);
    if (!tab || tab.disabled) return;
    if (activeId === undefined) {
      setInternalActiveId(id);
    }
    if (onTabSelected) onTabSelected(id);
  };

  return (
    <div className={className}>
      <TabsButtons
        tabs={tabs.map(t => ({
          id: t.id,
          label: t.label,
          count: t.count,
          active: t.id === currentActiveId,
          controls: t.controls,
          icon: t.icon,
        }))}
        onTabClick={onClick}
      />
      <div className="py-4">
        {tabs.map(t => {
          const isActive = t.id === currentActiveId;
          const commonProps = {
            id: t.controls,
            role: 'tabpanel' as const,
            'aria-labelledby': `tab-${t.id}`,
            tabIndex: -1 as const,
            ref: (el: HTMLDivElement | null) => {
              panelRefs.current[t.id] = el;
            },
          };

          return (
            <div key={t.id} {...commonProps} className={isActive ? '' : 'hidden'}>
              {t.content}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export type { TabsProps, TabItem };

export { Tabs };
