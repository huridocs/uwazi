/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { useLoaderData, useLocation, useSearchParams } from 'react-router-dom';
import { Row, SortingState } from '@tanstack/react-table';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { ClientSettings } from 'app/apiResponseTypes';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, PaginationState, Paginator, Pill, Table } from 'app/V2/Components/UI';
import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { settingsAtom } from 'app/V2/atoms';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
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

// eslint-disable-next-line max-statements
const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<Row<ActivityLogEntryType> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { dateFormat = 'YYYY-MM-DD' } = useAtomValue<ClientSettings>(settingsAtom);
  const [sorting, setSorting] = useState<SortingState>([]);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useIsFirstRender();
  const appliedFilters = getAppliedFilters(searchParams);

  const appliedFiltersCount = Object.keys(appliedFilters).filter(key =>
    ['method', 'username', 'search', 'dateRange'].includes(key)
  ).length;

  const { activityLogData, totalPages, total, error } = useLoaderData() as LoaderData;

  useEffect(() => {
    const [currentSorting] = sorting || [];
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

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
              defaultSorting={sorting}
              sortingFn={sortingState => {
                setSorting(sortingState);
              }}
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
