import React from 'react';
import { Translate, t } from '#app/I18N/index.js';
import { SegmentedControl, ToggleChip } from '#V2/Components/UI/index.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { LibraryResultsGroupedCard } from './LibraryResultsGroupedCard.js';
import { LibraryResultsPassages } from './LibraryResultsPassages.js';
import type { LibraryResultView, MatchType, MatchTypeFilters } from './libraryResultSnippets.js';
import type { ResultsLayout } from './useLibraryResultsState.js';

type LibraryResultsListProps = {
  views: LibraryResultView[];
  counts: Record<MatchType, number>;
  layout: ResultsLayout;
  active: MatchTypeFilters;
  collapsedIds: ReadonlySet<string>;
  passagesFolded: boolean;
  templates: ClientTemplateSchema[];
  onLayout: (layout: ResultsLayout) => void;
  onToggleType: (key: MatchType) => void;
  onToggleCard: (sharedId: string) => void;
  onFocusProperty: (sharedId: string, fieldKey: string) => void;
  onSelect: (sharedId: string) => void;
};

const matchTypes = (): { key: MatchType; label: string }[] => [
  { key: 'title', label: t('System', 'Title', null, false) },
  { key: 'properties', label: t('System', 'Properties', null, false) },
  { key: 'document', label: t('System', 'Document', null, false) },
];

const LibraryResultsList = ({
  views,
  counts,
  layout,
  active,
  collapsedIds,
  passagesFolded,
  templates,
  onLayout,
  onToggleType,
  onToggleCard,
  onFocusProperty,
  onSelect,
}: LibraryResultsListProps) => {
  let list = (
    <p className="pt-6 text-center text-xs text-ink-tertiary">
      <Translate>No results for the selected match types.</Translate>
    </p>
  );
  if (views.length > 0 && layout === 'grouped') {
    list = (
      <div className="flex flex-col gap-2.5 pb-2">
        {views.map(view => {
          const hasBody = view.properties.length > 0 || view.fullText.length > 0;
          return (
            <LibraryResultsGroupedCard
              key={view.sharedId}
              view={view}
              folded={collapsedIds.has(view.sharedId)}
              template={templates.find(item => item._id === view.template)}
              onToggle={hasBody ? () => onToggleCard(view.sharedId) : undefined}
              onFocusProperty={onFocusProperty}
              onSelect={onSelect}
            />
          );
        })}
      </div>
    );
  }
  if (views.length > 0 && layout === 'passages') {
    list = (
      <LibraryResultsPassages
        views={views}
        folded={passagesFolded}
        templates={templates}
        onFocusProperty={onFocusProperty}
        onSelect={onSelect}
      />
    );
  }

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-1 pb-2">
        {matchTypes().map(({ key, label }) => (
          <ToggleChip
            key={key}
            label={label}
            count={counts[key]}
            active={active[key]}
            onToggle={() => onToggleType(key)}
          />
        ))}
        <span className="ms-auto">
          <SegmentedControl
            size="sm"
            showLabels="always"
            ariaLabel={t('System', 'Results layout', null, false)}
            value={layout}
            onChange={onLayout}
            options={[
              {
                id: 'grouped',
                label: <Translate>Grouped</Translate>,
                title: t('System', 'Grouped', null, false),
              },
              {
                id: 'passages',
                label: <Translate>Passages</Translate>,
                title: t('System', 'Passages', null, false),
              },
            ]}
          />
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">{list}</div>
    </>
  );
};

export { LibraryResultsList };
