import React, { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLoaderData } from 'react-router';
import { useAtomValue } from 'jotai';
import { useQueryStates } from 'nuqs';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import {
  isEntityViewerV2Enabled,
  getEntityViewerV2BasePath,
} from '#app/utils/entityViewerPaths.js';
import { LibraryView } from './Components/LibraryView.js';
import type { Chip } from './Components/LibraryToolbar.js';
import { librarySearchParams } from './librarySearchParams.js';
import { DEFAULT_LIBRARY_URL_STATE, type LibraryFiltersState } from './libraryUrlState.js';
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

const chipLabel = (
  key: string,
  value: string,
  templates: { _id: string; name: string }[]
): ReactNode => {
  if (key === 'status') {
    return <Translate>{value === 'restricted' ? 'Restricted' : 'Published'}</Translate>;
  }
  if (key === 'type') {
    const template = templates.find(item => item._id === value);
    if (!template) {
      return value;
    }
    return <Translate context={template._id}>{template.name}</Translate>;
  }
  return `${key}: ${value}`;
};

const Library = () => {
  const data = useLoaderData() as LoaderResponse;
  const [urlState, setUrlState] = useQueryStates(librarySearchParams);
  const settings = useAtomValue(settingsAtom);
  const templates = useAtomValue(templatesAtom);
  const [selectedId, setSelectedId] = useState<string>();
  const [searchInput, setSearchInput] = useState(urlState.search);

  const updateUrl = useCallback(
    (patch: Parameters<typeof setUrlState>[0]) => {
      setUrlState(patch).catch(() => undefined);
    },
    [setUrlState]
  );

  useEffect(() => {
    setSearchInput(urlState.search);
  }, [urlState.search]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      if (searchInput !== urlState.search) {
        updateUrl({ search: searchInput || null, from: 0 });
      }
    }, 300);
    return () => window.clearTimeout(timeout);
  }, [searchInput, updateUrl, urlState.search]);

  const entityBasePath = getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features));

  const chips = useMemo((): Chip[] => {
    const items: Chip[] = [];
    Object.entries(urlState.filters).forEach(([key, values]) => {
      values.forEach(value => {
        items.push({
          key: `${key}:${value}`,
          label: chipLabel(key, value, templates),
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
  }, [templates, updateUrl, urlState.filters]);

  return (
    <LibraryView
      rows={data.rows}
      totalRows={data.totalRows}
      aggregations={data.aggregations}
      search={searchInput}
      onSearchChange={setSearchInput}
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
      onFiltersChange={filters => {
        updateUrl({ filters, from: 0 });
      }}
      chips={chips}
      selectedId={selectedId}
      onSelect={setSelectedId}
      entityBasePath={entityBasePath}
      onLoadMore={amount => {
        updateUrl({ from: data.rows.length, limit: amount });
      }}
    />
  );
};

export { Library };
