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
import { SortingState } from '@tanstack/react-table';
import { DebouncedFunc, debounce, isUndefined, omitBy } from 'lodash';
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
  from?: number;
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

  const sortOptions = sortingParams.includes(sort)
    ? { prop: sort, asc: +(order === 'asc') }
    : { prop: 'time', asc: 0 };
  const params = {
    ...(username !== undefined ? { username } : {}),
    ...(search !== undefined ? { method: [search] } : {}),
    ...(search !== undefined ? { find: search } : {}),
    ...(search !== undefined ? { search } : {}),
    ...(from !== undefined && to !== undefined ? { from, to } : {}),
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
  from: number;
  to: number;
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
    username,
    search,
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

  const updateSearchUrl = (updatedParams: ActivityLogSearch) =>
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
    const updatedParams = { ...searchedParams, ...filters };
    navigate(updateSearchUrl(updatedParams));
  };

  const de = useRef<DebouncedFunc<() => void> | null>(null);

  const debouncedChangeHandler = useMemo(
    () => (handler: () => void) => {
      de.current = debounce(handler, 500);
      return de.current;
    },
    []
  );

  useEffect(() => {
    if (isFirstRender) {
      return;
    }
    de.current?.cancel();
    const subscription = watch(async () => debouncedChangeHandler(handleSubmit(onSubmit))());
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, watch]);

  const setFieldValue = (field: searchParam, value: string | number) => {
    if (value !== undefined) {
      setValue(field, value);
    }
  };

  useEffect(() => {
    if (isFirstRender) {
      setFieldValue('username', username);
      setFieldValue('search', search);
      setFieldValue('from', from);
      setFieldValue('to', to);
      setSorting([{ id: sort, desc: order === 'desc' }]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchedParams]);

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
          <form onSubmit={handleSubmit(onSubmit)} id="account-form">
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
                  handleSubmit(onSubmit);
                }}
                hasErrors={!!errors.username}
                {...register('username')}
                onChange={e => {
                  setValue('username', e.target.value);
                  handleSubmit(onSubmit);
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
                language="en-es"
                labelToday="today"
                hasErrors={!!errors.from || !!errors.to}
                labelClear="clear"
                {...register('from')}
                onStartChange={e => {
                  setValue('from', e.target.datepicker.dates[0]);
                }}
                onEndChange={e => {
                  setValue('to', e.target.datepicker.dates[0]);
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
