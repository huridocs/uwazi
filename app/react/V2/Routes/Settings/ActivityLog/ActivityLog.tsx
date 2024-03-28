/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  LoaderFunction,
  useLoaderData,
  useLocation,
  useSearchParams,
  createSearchParams,
} from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { IncomingHttpHeaders } from 'http';
import _ from 'lodash';
import { SortingState } from '@tanstack/react-table';
import { Translate, t } from 'app/I18N';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { SettingsContent } from 'app/V2/Components/Layouts/SettingsContent';
import { InputField, DateRangePicker } from 'app/V2/Components/Forms';
import { PaginationState, Paginator, Table } from 'app/V2/Components/UI';
import * as activityLogAPI from 'V2/api/activityLog';
import type { ActivityLogResponse } from 'V2/api/activityLog';
import { useIsFirstRender } from 'app/V2/CustomHooks/useIsFirstRender';
import { ActivityLogEntryType } from 'shared/types/activityLogEntryType';
import { useRecoilValue } from 'recoil';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom, translationsAtom } from 'app/V2/atoms';
import { getActivityLogColumns } from './components/TableElements';
import { ActivityLogSidePanel } from './components/ActivityLogSidePanel';

const ITEMS_PER_PAGE = 100;

interface LoaderData {
  activityLogData: ActivityLogEntryType[];
  totalPages: number;
  total: number;
  page: number;
}

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

const ActivityLog = () => {
  const [selectedEntry, setSelectedEntry] = useState<ActivityLogEntryType | null>(null);
  const { dateFormat = 'yyyy-mm-dd' } = useRecoilValue<ClientSettings>(settingsAtom);
  const { locale } = useRecoilValue<{ locale: string }>(translationsAtom);
  const [sorting, setSorting] = useState<SortingState>([]);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isFirstRender = useIsFirstRender();
  const searchedParams = searchParamsFromSearchParams(searchParams);
  const {
    from,
    to,
    sort,
    order,
    page = 1,
    limit = ITEMS_PER_PAGE,
    username,
    search,
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
    defaultValues: {
      username,
      search,
    },
  });

  const { activityLogData, totalPages, total } = useLoaderData() as LoaderData;

  const onCloseSidePanel = () => {
    setSelectedEntry(null);
  };

  const updateSearch = (filters: any) => {
    const filterPairs = _(filters).toPairs().sortBy(0).value();
    const newFilters = createSearchParams(filterPairs);
    if (newFilters.toString() !== searchParams.toString()) {
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
    if (isFirstRender && (!sortingProp || (sortingProp === sort && sortingOrder === order))) {
      return;
    }
    updateSearch({ sort: sortingProp, order: sortingOrder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const onSubmit = async (data: ActivityLogSearch) => {
    updateSearch(data);
  };

  const debouncedChangeHandler = useMemo(
    () => (handler: (_args?: any) => void) => _.debounce(handler, 500),
    []
  );

  const de = useRef<any>(null);

  const handleInputSubmit =
    (field: 'username' | 'search') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, e.target.value);
      handleSubmit(onSubmit);
    };

  useEffect(() => {
    de.current?.cancel();
    const subscription = watch(async () => {
      de.current = debouncedChangeHandler(handleSubmit(onSubmit))();
      return de.current;
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handleSubmit, watch]);

  const columns = getActivityLogColumns(setSelectedEntry, dateFormat);

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-activity-log"
    >
      <SettingsContent>
        <SettingsContent.Header title="Activity Log" />
        <SettingsContent.Body>
          <form
            id="activity-filters-form mr-10"
            onSubmit={handleSubmit(async data => onSubmit(data))}
          >
            <div className="flex flex-row items-center gap-4 justify-items-stretch">
              <h2 className="w-40 p-4 text-base font-semibold text-left">
                <Translate>Activity Log</Translate>
              </h2>
              <InputField
                id="username"
                label="User"
                className="basis-1/5"
                hideLabel
                placeholder="User"
                hasErrors={!!errors.username}
                {...register('username')}
                clearFieldAction={() => {
                  setValue('username', '');
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
                onChange={debouncedChangeHandler(handleInputSubmit('username'))}
                onBlur={() => {}}
              />
              <InputField
                id="search"
                label="search"
                hideLabel
                className="basis-2/5"
                placeholder={t('System', 'by IDs, methods, keywords, etc.', null, false)}
                {...register('search')}
                clearFieldAction={() => {
                  setValue('search', '');
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
                onChange={debouncedChangeHandler(handleInputSubmit('search'))}
                hasErrors={!!errors.search}
                onBlur={() => {}}
              />

              <DateRangePicker
                dateFormat={dateFormat}
                language={locale}
                from={from}
                to={to}
                placeholderStart="From"
                placeholderEnd="To"
                labelToday="today"
                className="basis-1/3"
                hasErrors={!!errors.from || !!errors.to}
                labelClear="clear"
                onFromDateSelected={e => {
                  setValue('from', e.target.value);
                  if (to === undefined || to === '') {
                    setValue('to', e.target.value);
                  }
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
                onToDateSelected={e => {
                  setValue('to', e.target.value);
                  if (from === undefined || from === '') {
                    setValue('from', e.target.value);
                  }
                  debouncedChangeHandler(handleSubmit(onSubmit));
                }}
              />
            </div>
          </form>
          <Table<ActivityLogEntryType>
            columns={columns}
            data={activityLogData}
            sorting={sorting}
            setSorting={setSorting}
            footer={
              <div className="flex justify-between h-6">
                <PaginationState
                  page={Number(page)}
                  size={limit}
                  total={total}
                  currentLength={activityLogData.length}
                />
                <div>
                  <Paginator
                    totalPages={totalPages}
                    currentPage={Number(page)}
                    buildUrl={(pageTo: string | number) => {
                      const updatedParams = { ...searchedParams, page: pageTo, limit };
                      return `${location.pathname}?${createSearchParams(Object.entries(updatedParams))}`;
                    }}
                  />
                </div>
              </div>
            }
          />
          {selectedEntry && (
            <ActivityLogSidePanel
              selectedEntry={selectedEntry.original}
              isOpen={selectedEntry !== null}
              onClose={onCloseSidePanel}
            />
          )}
        </SettingsContent.Body>
      </SettingsContent>
    </div>
  );
};

export { ActivityLog, activityLogLoader };
