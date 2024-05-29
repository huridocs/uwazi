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
import _ from 'lodash';
import { Row, SortingState } from '@tanstack/react-table';
import { Translate } from 'app/I18N';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { Button, PaginationState, Paginator, Table } from 'app/V2/Components/UI';
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
  method?: string;
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
    method,
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
  const params = {
    ...(username !== undefined ? { username } : {}),
    ...(search !== undefined ? { search } : {}),
    ...(fromDate || toDate ? { time } : {}),
    ...(method !== undefined ? { method: [method] } : {}),
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
  const searchedParams = searchParamsFromSearchParams(searchParams);

  const { activityLogData, totalPages, total, error } = useLoaderData() as LoaderData;

  const changedParams = (filterPairs: [string, any][]) => {
    const newFilters = createSearchParams(filterPairs);
    return Array.from(newFilters).filter(([_key, value]) => value !== '');
  };

  const updateSearch = (filters: any) => {
    const filterPairs = _(filters).toPairs().sortBy(0).value();
    const changedPairs = changedParams(filterPairs);
    if (!_.isEqual(changedPairs, Array.from(searchParams))) {
      setSearchParams((prev: URLSearchParams) => {
        filterPairs.forEach(([key, value]) => {
          if (value !== undefined && value !== '') {
            prev.set(key, value);
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
        (sortingProp === searchedParams.sort && sortingOrder === searchedParams.order))
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
            <Button type="button" className="mr-0" onClick={() => setShowFilters(true)}>
              <Translate>Show filters</Translate>
            </Button>
          </div>
          {error === undefined && (
            <Table<ActivityLogEntryType>
              columns={columns}
              data={activityLogData}
              sorting={sorting}
              setSorting={setSorting}
              footer={
                <div className="flex justify-between h-6">
                  <PaginationState
                    page={Number(searchedParams.page || 1)}
                    size={searchedParams.limit || ITEMS_PER_PAGE}
                    total={total}
                    currentLength={activityLogData.length}
                  />
                  <div>
                    <Paginator
                      totalPages={totalPages}
                      currentPage={Number(searchedParams.page || 1)}
                      buildUrl={(pageTo: string | number) => {
                        const updatedParams = {
                          ...searchedParams,
                          page: pageTo,
                          limit: searchedParams.limit || ITEMS_PER_PAGE,
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
        searchParams={searchedParams}
      />
    </div>
  );
};

export { ActivityLog, activityLogLoader };
