import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { t } from '#app/I18N/index.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import { LibraryResultsBlank } from './LibraryResultsBlank.js';
import { LibraryResultsList } from './LibraryResultsList.js';
import {
  libraryResultViews,
  matchTypeCounts,
  visibleLibraryResults,
} from './libraryResultSnippets.js';
import { canFoldResults, useLibraryResultsState } from './useLibraryResultsState.js';

type LibraryResultsPanelProps = {
  search: string;
  rows: readonly LibrarySearchHit[];
  onFocusProperty: (sharedId: string, fieldKey: string) => void;
  onSelect: (sharedId: string) => void;
  onClearSearch: () => void;
};

const summarize = (
  rows: readonly LibrarySearchHit[],
  active: ReturnType<typeof useLibraryResultsState>['active']
) => {
  const views = libraryResultViews(rows);
  const visible = visibleLibraryResults(views, active);
  return {
    views,
    counts: matchTypeCounts(views),
    visible,
    foldable: visible.filter(view => view.properties.length > 0 || view.fullText.length > 0),
  };
};

const barButtonClass = (disabled: boolean) =>
  `inline-flex shrink-0 items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium ${
    disabled
      ? 'cursor-default text-ink-muted'
      : 'cursor-pointer text-ink-secondary hover:bg-warm hover:text-ink'
  }`;

const resultsMode = (trimmed: string, viewCount: number) => {
  if (!trimmed) return 'prompt' as const;
  if (viewCount === 0) return 'none' as const;
  return 'list' as const;
};

const LibraryResultsPanel = ({
  search,
  rows,
  onFocusProperty,
  onSelect,
  onClearSearch,
}: LibraryResultsPanelProps) => {
  const templates = useAtomValue(templatesAtom) as ClientTemplateSchema[];
  const trimmed = search.trim();
  const state = useLibraryResultsState(trimmed);
  const summary = summarize(rows, state.active);
  const fold = canFoldResults({
    layout: state.layout,
    trimmed,
    viewCount: summary.views.length,
    foldable: summary.foldable,
    collapsedIds: state.collapsedIds,
    passagesFolded: state.passagesFolded,
  });
  const mode = resultsMode(trimmed, summary.views.length);

  return (
    <div data-testid="library-results-panel" className="flex h-full min-h-0 flex-col bg-warm">
      <div className="flex min-h-0 flex-1 flex-col px-3 pt-2">
        {mode === 'list' ? (
          <LibraryResultsList
            views={summary.visible}
            counts={summary.counts}
            layout={state.layout}
            active={state.active}
            collapsedIds={state.collapsedIds}
            passagesFolded={state.passagesFolded}
            templates={templates}
            onLayout={state.setLayout}
            onToggleType={key => state.setActive(current => ({ ...current, [key]: !current[key] }))}
            onToggleCard={sharedId =>
              state.setCollapsedIds(current => {
                const next = new Set(current);
                if (next.has(sharedId)) next.delete(sharedId);
                else next.add(sharedId);
                return next;
              })
            }
            onFocusProperty={onFocusProperty}
            onSelect={onSelect}
          />
        ) : (
          <LibraryResultsBlank mode={mode} search={trimmed} onClearSearch={onClearSearch} />
        )}
      </div>
      <div className="flex h-12 shrink-0 items-center gap-1 border-t border-border bg-paper px-1">
        <button
          type="button"
          onClick={
            fold.canCollapse
              ? () => {
                  if (state.layout === 'passages') state.setPassagesFolded(true);
                  else state.setCollapsedIds(new Set(summary.foldable.map(view => view.sharedId)));
                }
              : undefined
          }
          aria-disabled={!fold.canCollapse || undefined}
          className={barButtonClass(!fold.canCollapse)}
        >
          <ChevronUpIcon className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />
          {t('System', 'Collapse all', null, false)}
        </button>
        <button
          type="button"
          onClick={
            fold.canExpand
              ? () => {
                  if (state.layout === 'passages') state.setPassagesFolded(false);
                  else state.setCollapsedIds(new Set());
                }
              : undefined
          }
          aria-disabled={!fold.canExpand || undefined}
          className={barButtonClass(!fold.canExpand)}
        >
          <ChevronDownIcon className="h-3.5 w-3.5 text-ink-tertiary" aria-hidden />
          {t('System', 'Expand all', null, false)}
        </button>
      </div>
    </div>
  );
};

export type { LibraryResultsPanelProps };
export { LibraryResultsPanel };
