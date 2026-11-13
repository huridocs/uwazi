/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Sidepanel, Button } from '#V2/Components/UI/index.js';
import { Translate, t } from '#app/I18N/index.js';
import { InputField, DateRangePicker, MultiSelect } from '#V2/Components/Forms/index.js';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import type { ActivityLogSearch } from '../ActivityLogLoader.js';

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityLogSearch) => void;
  appliedFilters: ActivityLogSearch;
}

const clearedDateRange = (
  live: { from?: number | null; to?: number | null } | undefined,
  field: 'from' | 'to'
) => ({
  from: field === 'from' ? null : (live?.from ?? null),
  to: field === 'to' ? null : (live?.to ?? null),
});

const methodOptions = ['CREATE', 'UPDATE', 'DELETE', 'MIGRATE', 'WARNING'].map(method => ({
  label: t('System', method, null, false).toUpperCase(),
  value: method,
}));

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, appliedFilters }: FiltersSidePanelProps) => {
  const locale = useAtomValue(localeAtom);
  const [currentFilters, setCurrentFilters] = useState(appliedFilters);

  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityLogSearch>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: currentFilters,
  });

  useEffect(() => {
    setCurrentFilters(appliedFilters);
    reset(appliedFilters); // Reset form values when appliedFilters change (e.g., from URL)
  }, [appliedFilters, reset]);

  const username = watch('username');
  const searchValue = watch('search');

  const handleInputSubmit =
    (field: 'username' | 'search' | 'method') => (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(field, e.target.value);
    };

  return (
    <Sidepanel
      withOverlay
      isOpen={isOpen}
      closeSidepanelFunction={onClose}
      title={<Translate className="uppercase">Filters</Translate>}
    >
      <form
        id="activity-filters-form"
        onSubmit={handleSubmit(async data => onSubmit(data))}
        style={{ width: '100%', overflowY: 'auto', scrollbarGutter: 'stable' }}
      >
        <Sidepanel.Body>
          <div className="flex flex-col">
            <MultiSelect
              value={currentFilters.method || []}
              label={<Translate>Action</Translate>}
              options={methodOptions}
              onChange={selected => {
                setValue('method', selected);
              }}
              hasErrors={!!errors.method}
              updatable
            />
            <div className="p-4">
              <InputField
                id="username"
                label={<Translate>User</Translate>}
                hasErrors={!!errors.username}
                {...register('username')}
                value={username ?? ''}
                clearFieldAction={() => {
                  setValue('username', '');
                }}
                onChange={handleInputSubmit('username')}
              />
              <InputField
                id="search"
                label={<Translate>Search</Translate>}
                className="my-4"
                placeholder={t('System', 'by ids, methods, keywords, etc.', null, false)}
                {...register('search')}
                value={searchValue ?? ''}
                clearFieldAction={() => {
                  setValue('search', '');
                }}
                onChange={handleInputSubmit('search')}
                hasErrors={!!errors.search}
              />
              <Controller
                control={control}
                name="dateRange"
                render={({ field: { value }, fieldState }) => (
                  <DateRangePicker
                    key="activity-log-range"
                    label={<Translate translationKey="property daterange" />}
                    language={locale}
                    className="pt-4 -top-4"
                    placeholderStart={t('System', 'From', null, false)}
                    placeholderEnd={t('System', 'To', null, false)}
                    labelToday={t('System', 'Today', null, false)}
                    hasErrors={fieldState.error !== undefined}
                    labelClear={t('System', 'Clear', null, false)}
                    from={value?.from || undefined}
                    to={value?.to || undefined}
                    onFromDateSelected={timestamp => {
                      setValue('dateRange.from', timestamp);
                      if (!getValues('dateRange.to')) {
                        setValue('dateRange.to', timestamp);
                      }
                    }}
                    onToDateSelected={timestamp => {
                      setValue('dateRange.to', timestamp);
                      if (!getValues('dateRange.from')) {
                        setValue('dateRange.from', timestamp);
                      }
                    }}
                    onClear={(field: 'from' | 'to') => {
                      const dateRange = clearedDateRange(getValues('dateRange'), field);
                      setValue('dateRange', dateRange);
                      setCurrentFilters(previous => ({ ...previous, dateRange }));
                    }}
                  />
                )}
              />
            </div>
          </div>
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3">
          <div className="flex gap-2">
            <Button
              className="grow"
              type="button"
              variant="secondary"
              onClick={() => {
                setCurrentFilters({
                  ...currentFilters,
                  dateRange: { from: null, to: null },
                  method: [],
                });
                reset({
                  username: '',
                  method: [],
                  search: '',
                  dateRange: { from: null, to: null },
                });
              }}
            >
              <Translate>Clear all</Translate>
            </Button>
            <Button className="grow" type="submit">
              <Translate>Apply</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};
export { FiltersSidePanel, clearedDateRange };
