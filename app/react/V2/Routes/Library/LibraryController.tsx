import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLoaderData, useRevalidator } from 'react-router';
import { useAtomValue } from 'jotai';
import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import { Translate } from '#app/I18N/index.js';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { LibraryAggregations } from '#shared/types/librarySearch.js';
import { settingsAtom, templatesAtom, thesauriAtom } from '#V2/atoms/index.js';
import { useDebouncedDraft } from '#V2/CustomHooks/useDebouncedDraft.js';
import { LibraryView } from './Components/LibraryView.js';
import type { Chip } from './Components/ActiveFiltersSheet.js';
import { resolveFilterChipParts } from './filterChipLabel.js';
import {
  DEFAULT_LIBRARY_URL_STATE,
  type LibraryFiltersState,
} from './libraryUrlState.js';
import {
  pruneLibraryFilters,
  pruneUnavailableFilters,
  sameLibraryFilterCriteria,
} from './pruneLibraryFilters.js';
import { useLibraryUrlState } from './useLibraryUrlState.js';
import type { LibrarySearchHit } from '#shared/types/librarySearch.js';
import {
  forgetCreatedRows,
  mergeCreatedLibraryRows,
  rememberCreatedRow,
  type CreatedLibraryRows,
} from './Components/libraryCreatedRows.js';
import type { LoaderResponse } from './types.js';

const removeFilterValue = (
  filters: LibraryFiltersState,
  key: string,
  value: string
): LibraryFiltersState => {
  const next = { ...filters };
  next[key] = (next[key] ?? []).filter(item => item !== value);
  if (!next[key]?.length) {
    delete next[key];
  }
  return next;
};

const urlFilterPatch = (pruned: { filters: LibraryFiltersState; andFilters: string[] }) => ({
  filters: pruned.filters,
  andFilters: pruned.andFilters.length ? pruned.andFilters : null,
});

const prunedFilterPatch = (
  filters: LibraryFiltersState,
  andFilters: string[],
  templates: Template[]
) =>
  urlFilterPatch(
    pruneLibraryFilters({
      filters,
      andFilters,
      templates,
      typeIds: filters.type ?? [],
    })
  );

const libraryFiltersPatch = (
  filters: LibraryFiltersState,
  andFilters: string[],
  templates: Template[]
) => ({ ...prunedFilterPatch(filters, andFilters, templates), page: null });

const appliedFilterPatch = (input: {
  filters: LibraryFiltersState;
  andFilters: string[];
  templates: Template[];
  aggregations: LibraryAggregations;
}) => {
  const scoped = prunedFilterPatch(input.filters, input.andFilters, input.templates);
  return urlFilterPatch(
    pruneUnavailableFilters({
      filters: scoped.filters,
      andFilters: scoped.andFilters ?? [],
      templates: input.templates,
      aggregations: input.aggregations,
    })
  );
};

const useAppliedLibraryFilters = (
  source: {
    urlState: { filters: LibraryFiltersState; andFilters: string[] };
    templates: Template[];
    aggregations: LibraryAggregations;
  },
  updateUrl: (patch: { filters: LibraryFiltersState; andFilters: string[] | null }) => void
) => {
  const { urlState, templates, aggregations } = source;
  const patch = templates.length
    ? appliedFilterPatch({
        filters: urlState.filters,
        andFilters: urlState.andFilters,
        templates,
        aggregations,
      })
    : undefined;

  useEffect(() => {
    if (!patch || sameLibraryFilterCriteria(urlState, patch)) {
      return;
    }
    updateUrl(patch);
  }, [patch, updateUrl, urlState]);
};

const translatedText = (text: string, context?: string) =>
  context ? <Translate context={context}>{text}</Translate> : <Translate>{text}</Translate>;

const chipLabel = (chip: {
  key: string;
  value: string;
  templates: Template[];
  aggregations: LibraryAggregations;
  thesauri: ClientThesaurus[];
  typeIds?: string[];
}): ReactNode => {
  const parts = resolveFilterChipParts(chip.key, chip.value, {
    templates: chip.templates,
    aggregations: chip.aggregations,
    thesauri: chip.thesauri,
    typeIds: chip.typeIds,
  });
  return (
    <>
      {translatedText(parts.propertyLabel, parts.propertyContext)}
      {': '}
      {parts.translateValue
        ? translatedText(parts.valueLabel, parts.valueContext)
        : parts.valueLabel}
    </>
  );
};

/** Owns library search state (URL + selection) and the workspace chrome.
 *  Result visualization is delegated to Viewers (cards, map, table, …). */
const useLibrarySearchInput = (
  search: string,
  updateUrl: (patch: { search: string | null; page: null }) => void
) => {
  const commitSearch = useCallback(
    (value: string) => {
      updateUrl({ search: value || null, page: null });
    },
    [updateUrl]
  );
  return useDebouncedDraft(search, commitSearch, {
    shouldCommitImmediately: value => value === '',
  });
};

const useLibrarySelection = (rows: readonly LibrarySearchHit[], totalRows: number) => {
  const revalidator = useRevalidator();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [created, setCreated] = useState<CreatedLibraryRows>({ hits: [], totalBefore: null });
  return {
    selectedIds,
    setSelectedIds,
    listed: mergeCreatedLibraryRows(rows, totalRows, created),
    onClosePreview: () => setSelectedIds([]),
    onEntitiesDeleted: (sharedIds: readonly string[]) => {
      setCreated(current => forgetCreatedRows(current, sharedIds));
    },
    onEntityCreated: (_sharedId?: string, row?: LibrarySearchHit) => {
      void revalidator.revalidate();
      if (row?.sharedId) {
        setCreated(current => rememberCreatedRow(current, { row, totalRows, rows }));
      }
    },
  };
};

const LibraryController = () => {
  const data = useLoaderData() as LoaderResponse;
  const { urlState, updateUrl } = useLibraryUrlState();
  const settings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const {
    selectedIds,
    setSelectedIds,
    listed,
    onClosePreview,
    onEntitiesDeleted,
    onEntityCreated,
  } = useLibrarySelection(data.rows, data.totalRows);
  const {
    draft: searchInput,
    setDraft: setSearchInput,
    commitNow: commitSearchNow,
  } = useLibrarySearchInput(urlState.search, updateUrl);

  useAppliedLibraryFilters(
    { urlState, templates, aggregations: data.aggregations },
    updateUrl
  );

  const chips = useMemo((): Chip[] => {
    const items: Chip[] = [];
    Object.entries(urlState.filters).forEach(([key, values]) => {
      values.forEach(value => {
        items.push({
          key: `${key}:${value}`,
          label: chipLabel({
            key,
            value,
            templates,
            aggregations: data.aggregations,
            thesauri,
            typeIds: urlState.filters.type,
          }),
          color:
            key === 'type' ? templates.find(template => template._id === value)?.color : undefined,
          onRemove: () => {
            updateUrl(
              libraryFiltersPatch(
                removeFilterValue(urlState.filters, key, value),
                urlState.andFilters,
                templates
              )
            );
          },
        });
      });
    });
    return items;
  }, [data.aggregations, templates, thesauri, updateUrl, urlState.andFilters, urlState.filters]);

  return (
    <LibraryView
      rows={listed.rows}
      totalRows={listed.totalRows}
      aggregations={data.aggregations}
      search={searchInput}
      committedSearch={urlState.search}
      onSearchChange={setSearchInput}
      onSearchSubmit={commitSearchNow}
      view={urlState.view}
      onViewChange={view => {
        updateUrl({ view: view === DEFAULT_LIBRARY_URL_STATE.view ? null : view });
      }}
      sort={urlState.sort}
      order={urlState.order}
      onSortChange={(nextSort, nextOrder) => {
        updateUrl({
          sort: nextSort || null,
          order: nextOrder === DEFAULT_LIBRARY_URL_STATE.order ? null : nextOrder,
          page: null,
        });
      }}
      filters={urlState.filters}
      andFilters={urlState.andFilters}
      onFiltersChange={filters => {
        updateUrl(libraryFiltersPatch(filters, urlState.andFilters, templates));
      }}
      onAndFiltersChange={andFilters => {
        updateUrl(
          templates.length
            ? libraryFiltersPatch(urlState.filters, andFilters, templates)
            : { andFilters: andFilters.length ? andFilters : null, page: null }
        );
      }}
      chips={chips}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      onClosePreview={onClosePreview}
      entityBasePath={getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features))}
      page={urlState.page}
      limit={urlState.limit}
      onPageChange={page => {
        updateUrl({ page: page <= 1 ? null : page });
      }}
      onLimitChange={limit => {
        updateUrl({
          limit: limit === DEFAULT_LIBRARY_URL_STATE.limit ? null : limit,
          page: null,
        });
      }}
      onEntityCreated={onEntityCreated}
      onEntitiesDeleted={onEntitiesDeleted}
    />
  );
};

export { LibraryController };
