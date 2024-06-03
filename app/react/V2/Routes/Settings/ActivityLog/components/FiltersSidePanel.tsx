/* eslint-disable react/jsx-props-no-spreading */
import React, { useMemo, useEffect } from 'react';
import _ from 'lodash';
import { Sidepanel, Button } from 'app/V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { InputField, DateRangePicker, MultiSelect } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { useAtomValue } from 'jotai';
import { ClientSettings } from 'app/apiResponseTypes';
import { settingsAtom, translationsAtom } from 'app/V2/atoms';

interface ActivityLogSearch {
  username: string;
  search: string;
  page: number;
  from: string;
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

const methodOptions = [
  {
    label: t('System', 'CREATE', null, false).toUpperCase(),
    value: 'CREATE',
  },
  {
    label: t('System', 'UPDATE', null, false).toUpperCase(),
    value: 'UPDATE',
  },
  {
    label: t('System', 'DELETE', null, false).toUpperCase(),
    value: 'DELETE',
  },
  {
    label: t('System', 'MIGRATE', null, false).toUpperCase(),
    value: 'MIGRATE',
  },
  {
    label: t('System', 'WARNING', null, false).toUpperCase(),
    value: 'WARNING',
  },
];

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, appliedFilters }: FiltersSidePanelProps) => {
  const { dateFormat = 'yyyy-mm-dd' } = useAtomValue<ClientSettings>(settingsAtom);
  const { locale } = useAtomValue<{ locale: string }>(translationsAtom);

  const debouncedChangeHandler = useMemo(
    () => (handler: (_args?: any) => void) => _.debounce(handler, 500),
    []
  );

  const {
    register,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ActivityLogSearch>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: appliedFilters,
  });

  useEffect(() => {
    setValue('from', appliedFilters.from);
    setValue('to', appliedFilters.to);
  }, []);

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
              value={appliedFilters.method || []}
              label={<Translate>Action</Translate>}
              options={methodOptions}
              onChange={selected => {
                setValue('method', selected);
              }}
              hasErrors={!!errors.method}
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
                onChange={debouncedChangeHandler(handleInputSubmit('username'))}
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
                onChange={debouncedChangeHandler(handleInputSubmit('search'))}
                hasErrors={!!errors.search}
                onBlur={() => {}}
              />

              <DateRangePicker
                key="activity-log-range"
                label={<Translate>Date Range</Translate>}
                language={locale}
                mainClassName="pt-4 -top-4"
                register={register}
                placeholderStart={t('System', 'From', null, false)}
                placeholderEnd={t('System', 'To', null, false)}
                labelToday={t('System', 'Today', null, false)}
                hasErrors={!!errors.from || !!errors.to}
                labelClear={t('System', 'Clear', null, false)}
                onFromDateSelected={e => {
                  const fromChanged = !_.isEqual(e.target.value, appliedFilters.from || '');
                  if (fromChanged) {
                    setValue('from', e.target.value);
                  }
                }}
                onToDateSelected={e => {
                  const toChanged = !_.isEqual(e.target.value, appliedFilters.to || '');
                  if (toChanged) {
                    setValue('to', e.target.value);
                  }
                }}
                dateFormat={dateFormat}
                from={appliedFilters.from}
                to={appliedFilters.to}
                onClear={(field: 'from' | 'to') => {
                  setValue(field, '');
                }}
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
                reset({ username: '', method: [], search: '', from: '', to: '' });
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
