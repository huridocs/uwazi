/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { useLoaderData, useLocation, useSearchParams } from 'react-router';
import { Row, SortingState } from '@tanstack/react-table';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientSettings } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Layouts/Se... Remove this comment to see the full error message
import { SettingsContent } from '../../V2/Components/Layouts/SettingsContent.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, PaginationState, Paginator, Pill, Table } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/CustomHooks/useIsFirs... Remove this comment to see the full error message
import { useIsFirstRender } from '../../V2/CustomHooks/useIsFirstRender.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { settingsAtom } from '../../V2/atoms.js';
// @ts-expect-error TS(2307): Cannot find module '../../shared/types/activityLog... Remove this comment to see the full error message
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType.js';
import { getActivityLogColumns } from './components/TableElements';
import { ActivityLogSidePanel } from './components/ActivityLogSidePanel';
import { FiltersSidePanel } from './components/FiltersSidePanel';
import type { LoaderData } from './ActivityLogLoader';
import {
  getAppliedFilters,
  updateSearch,
  ActivityLogSearch,
  ITEMS_PER_PAGE,
  buildPageURL,
} from './ActivityLogLoader';

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
  // @ts-expect-error TS(2339): Property 'dateFormat' does not exist on type 'unkn... Remove this comment to see the full error message
  const { dateFormat = 'YYYY-MM-DD' } = useAtomValue<ClientSettings>(settingsAtom);
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

  const columns = getActivityLogColumns(setSelectedEntry, dateFormat);

  return (
    <div
      className="tw-content"
      style={{ width: '100%', height: '100%', overflowY: 'auto' }}
      data-testid="settings-activity-log"
    >
      <SettingsContent>
        <SettingsContent.Header title="Activity Log" />
        <SettingsContent.Body className="space-y-3">
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
              // @ts-expect-error TS(7031): Binding element 'sortingState' implicitly has an '... Remove this comment to see the full error message
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
