/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import {
  LoaderFunction,
  useLoaderData,
  useLocation,
  useSearchParams,
  createSearchParams,
} from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import _, { isArray } from 'lodash';
import { Row, SortingState } from '@tanstack/react-table';
import { FunnelIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, PaginationState, Paginator, Pill, Table } from 'app/V2/Components/UI';
import * as activityLogAPI from 'V2/api/activityLog';
import type { ActivityLogResponse } from 'V2/api/activityLog';
import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { useAtomValue } from 'jotai';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom } from 'app/V2/atoms';
import { getActivityLogColumns } from './components/TableElements';
import { ActivityLogSidePanel } from './components/ActivityLogSidePanel';
import { FiltersSidePanel } from './components/FiltersSidePanel';

const ITEMS_PER_PAGE = 100;

interface LoaderData {
  activityLogData: ActivityLogEntryType[];
  totalPages: number;
  total: number;
  page: number;
  error?: {};
}

const sortingParams = ['method', 'time', 'username', 'url'];

interface ActivityLogSearchParams {
  username?: string;
  search?: string;
  method?: string[];
  from?: string;
  to?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

const getQueryParamsBySearchParams = (searchParams: ActivityLogSearchParams) => {
  const {
    username,
    search,
    method = [],
    from,
    to,
    sort = 'time',
    order = 'desc',
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = searchParams;

  const fromDate = from && new Date(from).getTime() / 1000;
  const toDate = to && new Date(to).getTime() / 1000;
  const time = { ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) };
  const sortOptions = sortingParams.includes(sort)
    ? { prop: sort, asc: +(order === 'asc') }
    : { prop: 'time', asc: 0 };
  const methodList = isArray(method) ? method : [method];
  const params = {
    ...(username !== undefined ? { username } : {}),
    ...(search !== undefined ? { search } : {}),
    ...(fromDate || toDate ? { time } : {}),
    ...(methodList[0] !== undefined ? { method: methodList } : {}),
    page,
    limit,
    sort: sortOptions,
  };
  return params;
};
const activityLogLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ request }) => {
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const searchParams = searchParamsFromSearchParams(urlSearchParams);
    const params = getQueryParamsBySearchParams(searchParams);
    const activityLogList: ActivityLogResponse = await activityLogAPI.get(params, headers);
    if (activityLogList.message !== undefined) {
      return {
        error: activityLogList.message,
        activityLogData: [],
        totalPages: 0,
        page: 0,
        total: 0,
      };
    }
    const total = Number(params.page) * activityLogList.rows.length + activityLogList.remainingRows;
    const totalPages = Math.ceil(total / params.limit);

    return {
      activityLogData: activityLogList.rows,
      totalPages,
      page: params.page,
      total,
    };
  };

interface ActivityLogSearch {
  username: string;
  search: string;
  page: number;
  from: string;
  to: string;
  sort: string;
  order: string;
}

// eslint-disable-next-line max-statements
const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<Row<ActivityLogEntryType> | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const { dateFormat = 'yyyy-mm-dd' } = useAtomValue<ClientSettings>(settingsAtom);
  const [sorting, setSorting] = useState<SortingState>([]);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useIsFirstRender();
  let appliedFilters = searchParamsFromSearchParams(searchParams);
  appliedFilters =
    appliedFilters.method && !isArray(appliedFilters.method)
      ? { ...appliedFilters, method: [appliedFilters.method] }
      : appliedFilters;

  const appliedFiltersCount = Object.keys(appliedFilters).filter(key =>
    ['method', 'username', 'search', 'from', 'to'].includes(key)
  ).length;

  const { activityLogData, totalPages, total, error } = useLoaderData() as LoaderData;

  const changedParams = (filterPairs: [string, any][]) => {
    const newFilters = createSearchParams(filterPairs);
    return Array.from(newFilters).filter(([_key, value]) => value !== '');
  };

  const setSearchValue = (prev: URLSearchParams, key: string, value: any) => {
    if (!isArray(value)) {
      prev.set(key, value);
    } else if (value.length > 0) {
      prev.set(key, value[0]);
      value.splice(0, 1);
      value.forEach(item => {
        prev.append(key, item);
      });
    }
  };
  const updateSearch = (filters: any) => {
    const filterPairs = _(filters).toPairs().sortBy(0).value();
    const changedPairs = changedParams(filterPairs);
    if (!_.isEqual(changedPairs, Array.from(searchParams))) {
      setSearchParams((prev: URLSearchParams) => {
        filterPairs.forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            setSearchValue(prev, key, value);
          } else {
            prev.delete(key);
          }
        });
        return prev;
      });
    }
  };

  useEffect(() => {
    const sortingProp = sorting?.[0]?.id;
    const sortingOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    if (
      isFirstRender &&
      (!sortingProp ||
        (sortingProp === appliedFilters.sort && sortingOrder === appliedFilters.order))
    ) {
      return;
    }
    updateSearch({ sort: sortingProp, order: sortingOrder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const onSubmit = async (data: ActivityLogSearch) => {
    updateSearch(data);
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
              className="flex flex-row items-center gap-4 mr-0 align-middle"
              onClick={() => setShowFilters(true)}
            >
              <FunnelIcon
                stroke={
                  appliedFiltersCount > 0 ? 'rgb(30 64 175)' : 'rgb(115 115 115)rgb(115 115 115)'
                }
                fill={appliedFiltersCount > 0 ? 'rgb(30 64 175)' : 'rgb(115 115 115)'}
                className="w-5"
              />
              <Translate>Filters</Translate>
              {appliedFiltersCount > 0 && <Pill color="primary">{appliedFiltersCount}</Pill>}
            </Button>
          </div>
          {error === undefined && (
            <Table<ActivityLogEntryType>
              title={<Translate>Activity Log</Translate>}
              columns={columns}
              data={activityLogData}
              sorting={sorting}
              setSorting={setSorting}
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
                      buildUrl={(pageTo: string | number) => {
                        const updatedParams = {
                          ...appliedFilters,
                          page: pageTo,
                          limit: appliedFilters.limit || ITEMS_PER_PAGE,
                        };
                        return `${location.pathname}?${createSearchParams(Object.entries(updatedParams))}`;
                      }}
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

export { ActivityLog, activityLogLoader };
