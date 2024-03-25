/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LoaderFunction,
  useLoaderData,
  useLocation,
  useNavigate,
  useSearchParams,
  createSearchParams,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { IncomingHttpHeaders } from 'http';
import { debounce, isUndefined, omitBy } from 'lodash';
import { SortingState } from '@tanstack/react-table';
import { Translate, t } from 'app/I18N';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { InputField, DateRangePicker } from 'app/V2/Components/Forms';
import { Paginator, Table } from 'app/V2/Components/UI';
import * as activityLogAPI from 'V2/api/activityLog';
import type { ActivityLogResponse } from 'V2/api/activityLog';
import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { getActivityLogColumns } from './components/TableElements';
import { ActivityLogSidePanel } from './components/ActivityLogSidePanel';

const ITEMS_PER_PAGE = 100;

interface LoaderData {
  activityLogData: ActivityLogEntryType[];
  totalPages: number;
  page: number;
}

type searchParam = 'username' | 'search' | 'from' | 'to' | 'sort' | 'order' | 'page';
const sortingParams = ['method', 'time', 'username', 'url'];

interface ActivityLogSearchParams {
  username?: string;
  search?: string;
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
    from,
    to,
    sort = 'time',
    order = 'desc',
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = searchParams;

  let time = {};
  if (from !== undefined && to !== undefined) {
    const fromDate = new Date(from).getTime() / 1000;
    const toDate = new Date(to).getTime() / 1000;
    time = { time: { from: fromDate, to: toDate } };
  }
  const sortOptions = sortingParams.includes(sort)
    ? { prop: sort, asc: +(order === 'asc') }
    : { prop: 'time', asc: 0 };
  const params = {
    ...(username !== undefined ? { username } : {}),
    ...(search !== undefined ? { method: [search] } : {}),
    ...(search !== undefined ? { find: search } : {}),
    ...(search !== undefined ? { search } : {}),
    ...time,
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
      return { error: activityLogList.message };
    }
    const totalPages = Math.ceil(
      (activityLogList.rows.length + activityLogList.remainingRows) / params.limit
    );

    return {
      activityLogData: activityLogList.rows,
      totalPages,
      page: params.page,
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

const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<ActivityLogEntryType | null>(null);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isFirstRender = useIsFirstRender();
  const searchedParams = searchParamsFromSearchParams(searchParams);
  const {
    from,
    to,
    sort,
    order,
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = searchedParams;
  const {
    register,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityLogSearch>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const { activityLogData, totalPages } = useLoaderData() as LoaderData;

  const onCloseSidePanel = () => {
    setShowSidePanel(false);
    setSelectedEntry(null);
  };

  const updateSearchUrl = (updatedParams: any) =>
    `${location.pathname}?${createSearchParams(Object.entries(updatedParams))}`;

  useEffect(() => {
    const sortingProp = sorting?.[0]?.id;
    const sortingOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
    if (isFirstRender && (!sortingProp || (sortingProp === sort && sortingOrder === order))) {
      return;
    }
    const updatedParams = { ...searchedParams, sort: sortingProp, order: sortingOrder };
    navigate(updateSearchUrl(updatedParams));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const onSubmit = async (data: ActivityLogSearch) => {
    const filters = omitBy(omitBy(data, isUndefined), val => val === '');
    navigate(updateSearchUrl({ ...searchedParams, ...filters }));
  };

  const debouncedChangeHandler = useMemo(() => (handler: () => void) => debounce(handler, 500), []);
  const de = useRef<any>(null);

  useEffect(() => {
    de.current?.cancel();
    const subscription = watch(async () => {
      de.current = debouncedChangeHandler(handleSubmit(onSubmit))();
      return de.current;
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, watch]);

  const columns = getActivityLogColumns(setSelectedEntry);
  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-activity-log"
    >
      <SettingsContent>
        <SettingsContent.Header title="Activity Log" />
        <SettingsContent.Body>
          <form id="account-form">
            <div className="flex flex-row items-center gap-4 justify-items-stretch">
              <h2 className="basis-1/6">
                <Translate>Activity log</Translate>
              </h2>
              <InputField
                id="username"
                label="User"
                className="basis-1/5"
                hideLabel
                placeholder="User"
                clearFieldAction={() => {
                  setValue('username', '');
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
                hasErrors={!!errors.username}
                {...register('username')}
                onChange={e => {
                  setValue('username', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
              <InputField
                id="search"
                label="search"
                hideLabel
                className="basis-1/3"
                hasErrors={!!errors.search}
                placeholder={t('System', 'by IDs, methods, keywords, etc.', null, false)}
                {...register('search')}
                onChange={e => {
                  setValue('search', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
              <DateRangePicker
                from={from}
                to={to}
                placeholderStart="From"
                placeholderEnd="To"
                language="en-es"
                labelToday="today"
                hasErrors={!!errors.from || !!errors.to}
                labelClear="clear"
                {...register('from')}
                onFromDateSelected={e => {
                  setValue('from', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
                onToDateSelected={e => {
                  setValue('to', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
            </div>
          </form>
          <Table<ActivityLogEntryType>
            columns={columns}
            data={activityLogData}
            title={<Translate>Activity Log</Translate>}
            sorting={sorting}
            setSorting={setSorting}
            footer={
              <div className="flex justify-between h-6">
                <div className="">total pages</div>
                <div>
                  <Paginator
                    totalPages={totalPages}
                    currentPage={page}
                    buildUrl={(pageTo: string | number) => {
                      const updatedParams = { ...searchedParams, page: pageTo, limit };
                      return updateSearchUrl(updatedParams);
                    }}
                  />
                </div>
              </div>
            }
          />
          {selectedEntry && (
            <ActivityLogSidePanel
              selectedEntry={selectedEntry}
              isOpen={showSidePanel}
              onClose={onCloseSidePanel}
            />
          )}
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { ActivityLog, activityLogLoader };
