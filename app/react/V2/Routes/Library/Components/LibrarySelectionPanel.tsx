import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { I18NLink } from '#app/I18N/I18NLinkV2.js';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import { orderedSelectionIds } from '../librarySelection.js';

type LibrarySelectionPanelProps = {
  rows: LibrarySearchHit[];
  selectedIds: readonly string[];
  entityBasePath: string;
};

const viewLinkClassName =
  'inline-flex h-6 shrink-0 items-center rounded-md bg-warm px-2.5 text-[11px] font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink';

const LibrarySelectionPanel = ({
  rows,
  selectedIds,
  entityBasePath,
}: LibrarySelectionPanelProps) => {
  const templates = useAtomValue(templatesAtom);
  const templateName = useMemo(
    () => new Map(templates.map(template => [template._id, template.name])),
    [templates]
  );
  const hits = useMemo(() => new Map(rows.map(row => [row.sharedId, row])), [rows]);
  const listedIds = orderedSelectionIds(
    rows.map(row => row.sharedId),
    selectedIds
  );

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
      data-testid="library-selection-panel"
    >
      <div className="shrink-0 border-b border-border px-3 py-2.5">
        <h2 className="text-sm font-semibold text-ink">
          <Translate>Selection</Translate>
        </h2>
        <p className="text-xs text-ink-tertiary" data-testid="library-selection-count">
          {selectedIds.length} <Translate>entities</Translate>
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-y-auto" aria-label="Selected entities">
        {listedIds.map(sharedId => {
          const hit = hits.get(sharedId);
          const subtitle = hit ? templateName.get(hit.template) : undefined;
          return (
            <li
              key={sharedId}
              className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-ink">
                  {hit?.title ?? sharedId}
                </div>
                {subtitle ? (
                  <div className="truncate text-xs text-ink-tertiary">{subtitle}</div>
                ) : null}
              </div>
              <I18NLink
                to={`${entityBasePath}/${sharedId}`}
                onClick={event => event.stopPropagation()}
                className={viewLinkClassName}
              >
                <Translate>View</Translate>
              </I18NLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export type { LibrarySelectionPanelProps };
export { LibrarySelectionPanel };
