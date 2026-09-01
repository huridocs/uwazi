import React, { useCallback, useMemo, useState, type ReactNode } from 'react';
import { useLoaderData } from 'react-router';
import { useAtomValue } from 'jotai';
import { useQueryStates } from 'nuqs';
import { ClientThesaurus, Template } from '#app/apiResponseTypes.js';
import { Translate } from '#app/I18N/index.js';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { LibraryAggregations } from '#shared/types/librarySearch.js';
import { settingsAtom, templatesAtom, thesauriAtom } from '#V2/atoms/index.js';
import { LibraryView } from './Components/LibraryView.js';
import type { Chip } from './Components/ActiveFiltersSheet.js';
import { resolveFilterChipParts } from './filterChipLabel.js';
import { librarySearchParams } from './librarySearchParams.js';
import { DEFAULT_LIBRARY_URL_STATE, type LibraryFiltersState } from './libraryUrlState.js';
import type { LoaderResponse } from './types.js';
import { useLibrarySearchDraft } from './useLibrarySearchDraft.js';

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

const chipLabel = (
  key: string,
  value: string,
  templates: Template[],
  aggregations: LibraryAggregations,
  thesauri: ClientThesaurus[]
): ReactNode => {
  const parts = resolveFilterChipParts(key, value, templates, aggregations, thesauri);
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
const LibraryController = () => {
  const data = useLoaderData() as LoaderResponse;
  const [urlState, setUrlState] = useQueryStates(librarySearchParams);
  const settings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const [selectedId, setSelectedId] = useState<string>();

  const updateUrl = useCallback(
    (patch: Parameters<typeof setUrlState>[0]) => {
      setUrlState(patch).catch(() => undefined);
    },
    [setUrlState]
  );

  const commitSearch = useCallback(
    (value: string) => {
      updateUrl({ search: value || null, from: 0 });
    },
    [updateUrl]
  );
  const {
    draft: searchInput,
    setDraft: setSearchInput,
    commitNow: commitSearchNow,
  } = useLibrarySearchDraft(urlState.search, commitSearch);

  const entityBasePath = getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features));

  const chips = useMemo((): Chip[] => {
    const items: Chip[] = [];
    Object.entries(urlState.filters).forEach(([key, values]) => {
      values.forEach(value => {
        items.push({
          key: `${key}:${value}`,
          label: chipLabel(key, value, templates, data.aggregations, thesauri),
          color:
            key === 'type' ? templates.find(template => template._id === value)?.color : undefined,
          onRemove: () => {
            updateUrl({
              filters: removeFilterValue(urlState.filters, key, value),
              from: 0,
            });
          },
        });
      });
    });
    return items;
  }, [data.aggregations, templates, thesauri, updateUrl, urlState.filters]);

  return (
    <LibraryView
      rows={data.rows}
      totalRows={data.totalRows}
      aggregations={data.aggregations}
      search={searchInput}
      onSearchChange={setSearchInput}
      onSearchSubmit={commitSearchNow}
      view={urlState.view}
      onViewChange={view => {
        updateUrl({ view: view === DEFAULT_LIBRARY_URL_STATE.view ? null : view });
      }}
      sort={urlState.sort}
      order={urlState.order}
      onSortChange={(sort, order) => {
        updateUrl({
          sort: sort || null,
          order: order === DEFAULT_LIBRARY_URL_STATE.order ? null : order,
        });
      }}
      filters={urlState.filters}
      andFilters={urlState.andFilters}
      onFiltersChange={filters => {
        updateUrl({
          filters,
          ...(Object.keys(filters).length === 0 ? { andFilters: null } : {}),
          from: 0,
        });
      }}
      onAndFiltersChange={andFilters => {
        updateUrl({ andFilters: andFilters.length ? andFilters : null, from: 0 });
      }}
      chips={chips}
      selectedId={selectedId}
      onSelect={setSelectedId}
      onClosePreview={() => setSelectedId(undefined)}
      entityBasePath={entityBasePath}
      onLoadMore={amount => {
        updateUrl({ from: data.rows.length, limit: amount });
      }}
    />
  );
};

export { LibraryController };
