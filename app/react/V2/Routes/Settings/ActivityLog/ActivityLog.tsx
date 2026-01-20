/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { useLoaderData, useLocation, useSearchParams } from 'react-router';
import { Row, SortingState } from '@tanstack/react-table';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';

import { Translate } from '#app/I18N/index.js';

import { ClientSettings } from '#app/apiResponseTypes.js';

import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.jsx';

import { Button, PaginationState, Paginator, Pill, Table } from '#V2/Components/UI/index.js';

import { useIsFirstRender } from '#V2/CustomHooks/useIsFirstRender.js';

import { ActivityLogEntryType } from '#shared/types/activityLogEntryType.js';
import { getActivityLogColumns } from '#V2/Routes/Settings/ActivityLog/components/TableElements.jsx';
import { ActivityLogSidePanel } from '#V2/Routes/Settings/ActivityLog/components/ActivityLogSidePanel.jsx';
import { FiltersSidePanel } from '#V2/Routes/Settings/ActivityLog/components/FiltersSidePanel.jsx';
import type { LoaderData } from '#V2/Routes/Settings/ActivityLog/ActivityLogLoader.js';
import {
  getAppliedFilters,
  updateSearch,
  ActivityLogSearch,
  ITEMS_PER_PAGE,
  buildPageURL,
} from '#V2/Routes/Settings/ActivityLog/ActivityLogLoader.js';
import { settingsAtom } from '#V2/atoms/index.js';

const funnelColor = (appliedFiltersCount: number): string =>
  appliedFiltersCount > 0 ? 'rgb(30 64 175)' : 'rgb(115 115 115)rgb(115 115 115)';

const getDefaultSorting = (searchParams: URLSearchParams): SortingState => {
  if (searchParams?.get('sort')) {
    return [{ id: searchParams?.get('sort')!, desc: searchParams?.get('order') === 'desc' }];
  }
  return [];
};

// eslint-disable-next-line max-statements
const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<Row<ActivityLogEntryType> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useIsFirstRender();
  const appliedFilters = getAppliedFilters(searchParams);

  const appliedFiltersCount = Object.keys(appliedFilters).filter(key =>
    ['method', 'username', 'search', 'dateRange'].includes(key)
  ).length;

  const { activityLogData, totalPages, total, error } = useLoaderData() as LoaderData;

  const handleSorting = (sorting: SortingState) => {
    const [currentSorting] = sorting;
    const { id: sortingProp, desc } = currentSorting || {};
    const sortingOrder = desc ? 'desc' : 'asc';
    if (
      isFirstRender &&
      (!sortingProp ||
        (sortingProp === appliedFilters.sort && sortingOrder === appliedFilters.order))
    ) {
      return;
    }
    updateSearch({ sort: sortingProp, order: sortingOrder }, searchParams, setSearchParams);
  };

  const onSubmit = async (data: ActivityLogSearch) => {
    updateSearch(data, searchParams, setSearchParams);
    setShowFilters(false);
  };

  const columns = getActivityLogColumns(setSelectedEntry);

  return (
    <div
      className="tw-content"
      style={{ width: '100%', height: '100%', overflowY: 'auto' }}
      data-testid="settings-activity-log"
    >
      <SettingsContent>
        <SettingsContent.Header title="Activity Log" />
        <SettingsContent.Body className="gap-y-3">
          <div className="flex justify-end">
            <Button
              type="button"
              styling="light"
              size="small"
              className="flex flex-row gap-4 items-center mr-0 align-middle"
              onClick={() => setShowFilters(true)}
            >
              <FunnelIcon
                stroke={funnelColor(appliedFiltersCount)}
                fill={funnelColor(appliedFiltersCount)}
                className="w-5"
              />
              <Translate>Filters</Translate>
              {appliedFiltersCount > 0 && <Pill color="primary">{appliedFiltersCount}</Pill>}
            </Button>
          </div>
          {error === undefined && (
            <Table
              data={activityLogData}
              columns={columns}
              manualSorting
              defaultSorting={getDefaultSorting(searchParams)}
              onSort={({ sortingState }) => handleSorting(sortingState)}
              header={
                <Translate className="text-base font-semibold text-left text-gray-900 bg-white">
                  Activity Log
                </Translate>
              }
              footer={
                <div className="flex justify-between h-6">
                  <PaginationState
                    page={Number(appliedFilters.page || 1)}
                    size={appliedFilters.limit || ITEMS_PER_PAGE}
                    total={total}
                    currentLength={activityLogData.length}
                  />
                  <div>
                    <Paginator
                      totalPages={totalPages}
                      currentPage={Number(appliedFilters.page || 1)}
                      buildUrl={(pageTo: string | number) =>
                        buildPageURL(appliedFilters, pageTo, location)
                      }
                    />
                  </div>
                </div>
              }
            />
          )}
        </SettingsContent.Body>
      </SettingsContent>
      <ActivityLogSidePanel
        selectedEntry={selectedEntry?.original}
        isOpen={selectedEntry !== null}
        onClose={() => {
          setSelectedEntry(null);
        }}
      />
      <FiltersSidePanel
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onSubmit={onSubmit}
        appliedFilters={appliedFilters}
      />
    </div>
  );
};

export { ActivityLog };
