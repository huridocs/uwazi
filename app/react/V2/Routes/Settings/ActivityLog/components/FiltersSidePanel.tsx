/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Sidepanel, Button } from '../../V2/Components/UI.js';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate, t } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
import { InputField, DateRangePicker, MultiSelect } from '../../V2/Components/Forms.js';
import { useAtomValue } from 'jotai';
// @ts-expect-error TS(2307): Cannot find module '../../apiResponseTypes.js' or ... Remove this comment to see the full error message
import { ClientSettings } from '../../apiResponseTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/atoms.js' or its corr... Remove this comment to see the full error message
import { settingsAtom, localeAtom } from '../../V2/atoms.js';

interface ActivityLogSearch {
  username: string;
  search: string;
  page: number;
  dateRange: {
    from: string;
    to: string;
  };
  to: string;
  sort: string;
  order: string;
  method: string[];
}

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityLogSearch) => void;
  appliedFilters: ActivityLogSearch;
}

const methodOptions = ['CREATE', 'UPDATE', 'DELETE', 'MIGRATE', 'WARNING'].map(method => ({
  label: t('System', method, null, false).toUpperCase(),
  value: method,
}));

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, appliedFilters }: FiltersSidePanelProps) => {
  // @ts-expect-error TS(2339): Property 'dateFormat' does not exist on type 'unkn... Remove this comment to see the full error message
  const { dateFormat = 'YYYY-MM-DD' } = useAtomValue<ClientSettings>(settingsAtom);
  const locale = useAtomValue(localeAtom);
  const [currentFilters, setCurrentFilters] = useState(appliedFilters);

  useEffect(() => {
    setCurrentFilters(appliedFilters);
  }, [appliedFilters]);

  const {
    register,
    control,
    setValue,
    getValues,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityLogSearch>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: currentFilters,
  });

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
              // @ts-expect-error TS(7006): Parameter 'selected' implicitly has an 'any' type.
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
                clearFieldAction={() => {
                  setValue('username', '');
                }}
                onChange={handleInputSubmit('username')}
                onBlur={() => {}}
              />
              <InputField
                id="search"
                label={<Translate>Search</Translate>}
                className="my-4"
                placeholder={t('System', 'by ids, methods, keywords, etc.', null, false)}
                {...register('search')}
                clearFieldAction={() => {
                  setValue('search', '');
                }}
                onChange={handleInputSubmit('search')}
                hasErrors={!!errors.search}
                onBlur={() => {}}
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
                    from={value?.from || ''}
                    to={value?.to || ''}
                    // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
                    onFromDateSelected={e => {
                      setValue('dateRange.from', e.target.value);
                      if (!getValues('dateRange.to')) {
                        setValue('dateRange.to', e.target.value);
                      }
                    }}
                    // @ts-expect-error TS(7006): Parameter 'e' implicitly has an 'any' type.
                    onToDateSelected={e => {
                      setValue('dateRange.to', e.target.value);
                      if (!getValues('dateRange.from')) {
                        setValue('dateRange.from', e.target.value);
                      }
                    }}
                    dateFormat={dateFormat}
                    onClear={(field: 'from' | 'to') => {
                      setValue(`dateRange.${field}`, '');
                      setCurrentFilters({
                        ...currentFilters,
                        dateRange: { ...currentFilters.dateRange, [field]: '' },
                      });
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
              className="flex-grow"
              type="button"
              styling="outline"
              onClick={() => {
                setCurrentFilters({
                  ...currentFilters,
                  dateRange: { from: '', to: '' },
                  to: '',
                  method: [],
                });
                reset({ username: '', method: [], search: '', dateRange: { from: '', to: '' } });
              }}
            >
              <Translate>Clear all</Translate>
            </Button>
            <Button className="flex-grow" type="submit">
              <Translate>Apply</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </form>
    </Sidepanel>
  );
};
export { FiltersSidePanel };
