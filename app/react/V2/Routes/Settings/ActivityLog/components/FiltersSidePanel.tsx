import React, { useMemo } from 'react';
import _ from 'lodash';
import { Sidepanel, Button } from 'app/V2/Components/UI';
import { Translate, t } from 'app/I18N';
import { InputField, DateRangePicker } from 'app/V2/Components/Forms';
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
  method: string;
}

interface FiltersSidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ActivityLogSearch) => void;
  searchParams: ActivityLogSearch;
}

const FiltersSidePanel = ({ isOpen, onClose, onSubmit, searchParams }: FiltersSidePanelProps) => {
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
    defaultValues: searchParams,
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
      <Sidepanel.Body>
        <form id="activity-filters-form" onSubmit={handleSubmit(async data => onSubmit(data))}>
          <div className="flex flex-col my-4">
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
              id="method"
              label={<Translate>Method</Translate>}
              className="mt-4"
              {...register('method')}
              clearFieldAction={() => {
                setValue('method', '');
              }}
              onChange={debouncedChangeHandler(handleInputSubmit('method'))}
              hasErrors={!!errors.method}
              onBlur={() => {}}
            />
            <InputField
              id="search"
              label={<Translate>Search</Translate>}
              className="mt-4"
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
              label={<Translate>Date range</Translate>}
              language={locale}
              mainClassName="mt-4"
              register={register}
              placeholderStart={t('System', 'From', null, false)}
              placeholderEnd={t('System', 'To', null, false)}
              labelToday={t('System', 'Today', null, false)}
              hasErrors={!!errors.from || !!errors.to}
              labelClear={t('System', 'Clear', null, false)}
              onFromDateSelected={e => {
                const fromChanged = !_.isEqual(e.target.value, searchParams.from || '');
                if (fromChanged) {
                  setValue('from', e.target.value);
                }
              }}
              onToDateSelected={e => {
                const toChanged = !_.isEqual(e.target.value, searchParams.to || '');
                if (toChanged) {
                  setValue('to', e.target.value);
                }
              }}
              onClear={() => {
                reset();
                setValue('from', '');
                setValue('to', '');
              }}
              dateFormat={dateFormat}
            />
            <Button type="submit" className="mt-4 mr-0 grow">
              <Translate>Search</Translate>
            </Button>
          </div>
        </form>
      </Sidepanel.Body>
    </Sidepanel>
  );
};
export { FiltersSidePanel };
