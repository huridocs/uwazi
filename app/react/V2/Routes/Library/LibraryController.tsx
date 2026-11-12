import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
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
import { DEFAULT_LIBRARY_URL_STATE, type LibraryFiltersState } from './libraryUrlState.js';
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

const translatedText = (text: string, context?: string) =>
  context ? <Translate context={context}>{text}</Translate> : <Translate>{text}</Translate>;

const chipLabel = (chip: {
  key: string;
  value: string;
  templates: Template[];
  aggregations: LibraryAggregations;
  thesauri: ClientThesaurus[];
}): ReactNode => {
  const parts = resolveFilterChipParts(
    chip.key,
    chip.value,
    chip.templates,
    chip.aggregations,
    chip.thesauri
  );
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
    onEntityCreated: (sharedId?: string, row?: LibrarySearchHit) => {
      void revalidator.revalidate();
      if (row?.sharedId) {
        setCreated(current => rememberCreatedRow(current, { row, totalRows, rows }));
      }
      if (sharedId) setSelectedIds([sharedId]);
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

  const entityBasePath = getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features));

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
          }),
          color:
            key === 'type' ? templates.find(template => template._id === value)?.color : undefined,
          onRemove: () => {
            updateUrl({
              filters: removeFilterValue(urlState.filters, key, value),
              page: null,
            });
          },
        });
      });
    });
    return items;
  }, [data.aggregations, templates, thesauri, updateUrl, urlState.filters]);

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
        updateUrl({
          filters,
          ...(Object.keys(filters).length === 0 ? { andFilters: null } : {}),
          page: null,
        });
      }}
      onAndFiltersChange={andFilters => {
        updateUrl({ andFilters: andFilters.length ? andFilters : null, page: null });
      }}
      chips={chips}
      selectedIds={selectedIds}
      onSelectedIdsChange={setSelectedIds}
      onClosePreview={onClosePreview}
      entityBasePath={entityBasePath}
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
