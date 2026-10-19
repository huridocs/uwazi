import React from 'react';
import { t } from '#app/I18N/index.js';
import { AccentDot, TabButtons } from '#V2/Components/UI/index.js';

type PaneTab = 'filters' | 'results';

type LibrarySideTabsProps = {
  activeId: PaneTab;
  onChange: (id: PaneTab) => void;
  filtersDot: boolean;
  resultsDot: boolean;
};

const paneTabLabel = (text: string, dot: boolean) => (
  <>
    <span className="truncate">{text}</span>
    {dot ? (
      <span className="absolute -top-0.5 -end-0.5">
        <AccentDot />
      </span>
    ) : null}
  </>
);

const LibrarySideTabs = ({ activeId, onChange, filtersDot, resultsDot }: LibrarySideTabsProps) => (
  <div className="shrink-0 px-3.5 py-2">
    <TabButtons
      groupId="library-side"
      activeTabId={activeId}
      syncActiveTabId={activeId}
      onTabChange={id => onChange(id as PaneTab)}
      tabListAriaLabel={t('System', 'Library side panel', null, false)}
      buttons={[
        {
          id: 'filters',
          name: t('System', 'Filters', null, false),
          label: paneTabLabel(
            t('System', 'Filters', null, false),
            filtersDot && activeId !== 'filters'
          ),
        },
        {
          id: 'results',
          name: t('System', 'Results', null, false),
          label: paneTabLabel(
            t('System', 'Results', null, false),
            resultsDot && activeId !== 'results'
          ),
        },
      ]}
    />
  </div>
);

export type { LibrarySideTabsProps };
export { LibrarySideTabs };
