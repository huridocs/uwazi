/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect, useState } from 'react';
import { isEqual } from 'lodash';
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

const methodOptions = ['CREATE', 'UPDATE', 'DELETE', 'MIGRATE', 'WARNING'].map(method => ({
  label: t('System', method, null, false).toUpperCase(),
  value: method,
}));

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, appliedFilters }: FiltersSidePanelProps) => {
  const { dateFormat = 'yyyy-mm-dd' } = useAtomValue<ClientSettings>(settingsAtom);
  const { locale } = useAtomValue<{ locale: string }>(translationsAtom);
  const [currentFilters, setCurrentFilters] = useState(appliedFilters);

  useEffect(() => {
    setCurrentFilters(appliedFilters);
  }, [appliedFilters]);

  const {
    register,
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
              <DateRangePicker
                key="activity-log-range"
                label={<Translate key="property daterange" />}
                language={locale}
                className="pt-4 -top-4"
                register={register}
                placeholderStart={t('System', 'From', null, false)}
                placeholderEnd={t('System', 'To', null, false)}
                labelToday={t('System', 'Today', null, false)}
                hasErrors={!!errors.from || !!errors.to}
                labelClear={t('System', 'Clear', null, false)}
                onFromDateSelected={e => {
                  const fromChanged = !isEqual(e.target.value, currentFilters.from || '');
                  if (fromChanged) {
                    setValue('from', e.target.value);
                  }
                }}
                onToDateSelected={e => {
                  const toChanged = !isEqual(e.target.value, currentFilters.to || '');
                  if (toChanged) {
                    setValue('to', e.target.value);
                  }
                }}
                dateFormat={dateFormat}
                from={currentFilters.from}
                to={currentFilters.to}
                onClear={(field: 'from' | 'to') => {
                  setValue(field, '');
                  setCurrentFilters({ ...currentFilters, [field]: '' });
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
                setCurrentFilters({ ...currentFilters, from: '', to: '', method: [] });
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
