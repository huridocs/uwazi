/* eslint-disable react/jsx-props-no-spreading */
import { LoaderFunction, SetURLSearchParams, createSearchParams, Location } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import _, { isArray, isEqual, isObject } from 'lodash';
import moment from 'moment';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { ClientSettings } from 'app/apiResponseTypes';
import * as activityLogAPI from 'V2/api/activityLog';
import type { ActivityLogResponse } from 'V2/api/activityLog';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';

const ITEMS_PER_PAGE = 100;

type LogEntry = ActivityLogEntryType & { rowId: string };

interface LoaderData {
  activityLogData: LogEntry[];
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

const timeFilter = (from?: string, to?: string, dateFormat = 'YYYY-MM-DD') => {
  const fromDate = from && moment(from, dateFormat).toDate().getTime();
  const toDate = to && moment(to, dateFormat).toDate().getTime();
  return { ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) };
};

const sortParam = (sort = '', order = '') =>
  sortingParams.includes(sort) ? { prop: sort, asc: +(order === 'asc') } : { prop: 'time', asc: 0 };

const paramOrEmpty = (condition: boolean, param: {}) => (condition ? param : {});

const getQueryParamsBySearchParams = (
  searchParams: ActivityLogSearchParams,
  dateFormat = 'YYYY-MM-DD'
) => {
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
  const time = timeFilter(from, to, dateFormat.toUpperCase());
  const sortOptions = sortParam(sort, order);
  const methodList = isArray(method) ? method : [method];
  const params = {
    ...paramOrEmpty(username !== undefined, { username }),
    ...paramOrEmpty(search !== undefined, { search }),
    ...paramOrEmpty(time.from !== undefined || time.to !== undefined, { time }),
    ...paramOrEmpty(methodList[0] !== undefined, { method: methodList }),
    page,
    limit,
    sort: sortOptions,
  };
  return params;
};

const getAppliedFilters = (searchParams: URLSearchParams) => {
  let appliedFilters = searchParamsFromSearchParams(searchParams);
  appliedFilters =
    appliedFilters.method && !isArray(appliedFilters.method)
      ? { ...appliedFilters, method: [appliedFilters.method] }
      : appliedFilters;
  const { from, to, ...rest } = appliedFilters;
  return { ...rest, ...((from || to) && { dateRange: { from, to } }) };
};

const activityLogLoader =
  (headers?: IncomingHttpHeaders, handlerContext?: { settings?: ClientSettings }): LoaderFunction =>
  async ({ request }) => {
    const { settings } = handlerContext || { dateFormat: 'YYYY-MM-DD' };
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const searchParams = searchParamsFromSearchParams(urlSearchParams);
    const params = getQueryParamsBySearchParams(searchParams, settings?.dateFormat);
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
    const totalPages = Math.ceil(activityLogList.totalRows / params.limit);

    return {
      activityLogData: activityLogList.rows.map(row => ({ ...row, rowId: row._id })),
      totalPages,
      page: params.page,
      total: activityLogList.totalRows,
    };
  };

interface ActivityLogSearch {
  username?: string;
  search?: string;
  page?: number;
  dateRange?: {
    from?: string;
    to?: string;
  };
  sort?: string;
  order?: string;
}

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

const filterPairs = (filters: ActivityLogSearch) => {
  _.flatMap(filters);
  const pairs = _(filters).toPairs().sortBy(0).value();
  const plainFilters: [string, string][] = [];
  pairs.forEach(([key, value]) => {
    if (isArray(value) || !isObject(value)) {
      plainFilters.push([key, value]);
    } else {
      plainFilters.push(..._(value).toPairs().value());
    }
  });
  return _(plainFilters).sortBy(0).value();
};

const updateSearch = (
  filters: ActivityLogSearch,
  searchParams: URLSearchParams,
  setSearchParams: SetURLSearchParams
) => {
  const plainFilters = filterPairs(filters);
  const changedPairs = changedParams(plainFilters);
  if (!isEqual(changedPairs, Array.from(searchParams))) {
    setSearchParams((prev: URLSearchParams) => {
      prev.delete('page');
      plainFilters.forEach(([key, value]) => {
        if (
          value !== undefined &&
          ((isArray(value) && value.length > 0) || (!isArray(value) && value !== ''))
        ) {
          setSearchValue(prev, key, value);
        } else {
          prev.delete(key);
        }
      });
      return prev;
    });
  }
};

const buildPageURL = (appliedFilters: any, pageTo: string | number, location: Location<any>) => {
  const { dateRange, ...updatedParams } = {
    ...appliedFilters,
    page: pageTo,
    limit: appliedFilters.limit || ITEMS_PER_PAGE,
    ...appliedFilters.dateRange,
    dateRange: {},
  };
  const newParams: [string, string][] = [];
  Object.entries(updatedParams).forEach(([key, value]) => {
    if (!isArray(value)) {
      newParams.push([key, value as string]);
    } else {
      value.forEach(item => newParams.push([key, item as string]));
    }
  });
  return `${location.pathname}?${createSearchParams(newParams)}`;
};

export type { LoaderData, ActivityLogSearch, LogEntry };
export {
  activityLogLoader,
  getAppliedFilters,
  ITEMS_PER_PAGE,
  updateSearch,
  filterPairs,
  getQueryParamsBySearchParams,
  buildPageURL,
};
