/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useState } from 'react';
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
import { debounce, isEmpty, isUndefined, omitBy } from 'lodash';
import { Translate, t } from 'app/I18N';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { InputField, DatePicker } from 'app/V2/Components/Forms';
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

const sortingParams = ['method', 'time', 'username', 'url'];

const getQueryParamsBySearchParams = searchParams => {
  const {
    username,
    search,
    from,
    to,
    sort,
    order = 'desc',
    page = 1,
    limit = ITEMS_PER_PAGE,
  } = searchParams;

  const sortOptions = sortingParams.includes(sort)
    ? { prop: sort, asc: +(order === 'asc') }
    : { prop: 'time', asc: 0 };
  const params = {
    ...(username !== undefined ? { username } : {}),
    ...(search !== undefined ? { method: search } : {}),
    ...(search !== undefined ? { find: search } : {}),
    ...(search !== undefined ? { searchText: search } : {}),
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

  // useEffect(() => {
  //   if (isFirstRender && sorting.length === 0) {
  //     return;
  //   }
  //   const sortingProp = sorting?.[0]?.id;
  //   const sortingOrder = sorting?.[0]?.desc ? 'desc' : 'asc';
  //   const updatedParams = { ...searchedParams, sort: sortingProp, order: sortingOrder };
  //   navigate(updateSearchUrl(updatedParams));
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [sorting]);

  const onSubmit = async (data: ActivityLogSearch) => {
    const filters = omitBy(omitBy(data, isUndefined), val => val === '');
    const updatedParams = { ...searchedParams, ...filters };
    navigate(updateSearchUrl(updatedParams));
  };

  const debouncedChangeHandler = useMemo(() => (handler: () => void) => debounce(handler, 500), []);

  useEffect(() => {
    const subscription = watch(async () => handleSubmit(onSubmit)());
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, watch]);

  const setFieldValue = (field, value: string | number) => {
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
            <div className="flex flex-row">
              <h2>
                <Translate>Activity log</Translate>
              </h2>
              <InputField
                id="user"
                label="User"
                hideLabel={true}
                placeholder="User"
                hasErrors={!!errors.username}
                {...register('username')}
                onChange={e => {
                  setValue('username', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
              <InputField
                id="searchText"
                label="searchText"
                hideLabel={true}
                hasErrors={!!errors.search}
                placeholder={t('System', 'by IDs, methods, keywords, etc.', null, false)}
                {...register('search')}
                onChange={e => {
                  setValue('search', e.target.value);
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
              <DatePicker
                language="en-es"
                labelToday="today"
                hasErrors={!!errors.from}
                labelClear="clear"
                {...register('from')}
                onChange={e => {
                  setValue('from', new Date().getTime());
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
