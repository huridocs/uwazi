/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState, useRef } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import moment from 'moment';
import { Sidepanel, Button } from 'app/V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { InputField, MultiSelect } from 'app/V2/Components/Forms';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom, localeAtom } from 'app/V2/atoms';
import { DateRange } from 'app/V2/Components/Forms/DatePicker';

interface ActivityLogSearch {
  username: string;
  search: string;
  page: number;
  dateRange: {
    from: string | number | null;
    to: string | number | null;
  };
  to: string;
  sort: string;
  order: string;
  method: string[];
}

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    data: Omit<ActivityLogSearch, 'dateRange'> & { dateRange?: { from?: string; to?: string } }
  ) => void;
  appliedFilters: ActivityLogSearch;
}

const methodOptions = ['CREATE', 'UPDATE', 'DELETE', 'MIGRATE', 'WARNING'].map(method => ({
  label: t('System', method, null, false).toUpperCase(),
  value: method,
}));

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, appliedFilters }: FiltersSidePanelProps) => {
  const { dateFormat = 'YYYY-MM-DD' } = useAtomValue<ClientSettings>(settingsAtom);
  const locale = useAtomValue(localeAtom);
  const [currentFilters, setCurrentFilters] = useState(appliedFilters);
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCurrentFilters(appliedFilters);
  }, [appliedFilters]);

  const {
    register,
    control,
    setValue,
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

  const handleClearAll = () => {
    setValue('username', '');
    setValue('method', []);
    setValue('search', '');
    setValue('dateRange.from', null);
    setValue('dateRange.to', null);

    // Ensure refs are available before trying to clear them
    if (fromInputRef?.current) {
      fromInputRef.current.value = '';
    }
    if (toInputRef?.current) {
      toInputRef.current.value = '';
    }

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
        onSubmit={handleSubmit(async data => {
          const transformedData = {
            ...data,
            dateRange: {
              from: data.dateRange.from
                ? moment(Number(data.dateRange.from) * 1000).format(dateFormat)
                : undefined,
              to: data.dateRange.to
                ? moment(Number(data.dateRange.to) * 1000).format(dateFormat)
                : undefined,
            },
          };
          onSubmit(transformedData);
        })}
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
                clearFieldAction={() => {
                  setValue('username', '');
                }}
                onChange={handleInputSubmit('username')}
                onBlur={() => { }}
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
                onBlur={() => { }}
              />
              <Controller
                control={control}
                name="dateRange"
                render={({ field: { value }, fieldState }) => (
                  <DateRange
                    key="activity-log-range"
                    label={<Translate translationKey="property daterange" />}
                    locale={locale}
                    className="pt-4 -top-4"
                    placeholderStart={t('System', 'From', null, false)}
                    placeholderEnd={t('System', 'To', null, false)}
                    labelToday={t('System', 'Today', null, false)}
                    hasErrors={fieldState.error !== undefined}
                    labelClear={t('System', 'Clear', null, false)}
                    value={value}
                    onChange={(newValue: any) => {
                      setValue('dateRange', {
                        from: newValue.from ? moment(newValue.from).utc().valueOf() : null,
                        to: newValue.to ? moment(newValue.to).utc().valueOf() : null,
                      });
                    }}
                    format={dateFormat}
                    useTimezone={true}
                    onClear={(field: 'from' | 'to') => {
                      setValue(`dateRange.${field}`, null);
                      setCurrentFilters({
                        ...currentFilters,
                        dateRange: { ...currentFilters.dateRange, [field]: null },
                      });
                    }}
                    fromInputRef={fromInputRef}
                    toInputRef={toInputRef}
                  />
                )}
              />
            </div>
          </div>
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3">
          <div className="flex gap-2">
            <Button className="flex-grow" type="button" styling="outline" onClick={handleClearAll}>
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
