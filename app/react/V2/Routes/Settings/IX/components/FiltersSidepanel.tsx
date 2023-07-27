/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Translate, t } from 'app/I18N';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { Checkbox } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { useFetcher } from 'react-router-dom';

interface FiltersSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  aggregation: any;
}

interface Filter {
  labeled: {
    match: boolean;
    mismatch: boolean;
  };
  nonLabeled: {
    noSuggestion: boolean;
    noContext: boolean;
    obsolete: boolean;
    others: boolean;
  };
}

const header = (label: string, total: number) => {
  return (
    <div className="flex items-center space-x-2 text-indigo-700">
      <div className="flex-none">{label}</div>
      <div className="flex-1 border-t border-dashed border-t-gray-200" />
      <div className="flex-none">{total}</div>
    </div>
  );
};

const FiltersSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  aggregation,
}: FiltersSidepanelProps) => {
  const fetcher = useFetcher();

  const defaultFilter: Filter = {
    labeled: {
      match: false,
      mismatch: false,
    },
    nonLabeled: {
      noContext: false,
      noSuggestion: false,
      obsolete: false,
      others: false,
    },
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
  } = useForm({
    defaultValues: defaultFilter,
  });

  const submitFilters = async (filters: Filter) => {
    const formData = new FormData();
    formData.set('intent', 'filter-suggestions');
    formData.set('data', JSON.stringify(filters));
    fetcher.submit(formData, { method: 'post' });
    setShowSidepanel(false);
    reset(defaultFilter);
  };

  const checkOption = (e: any, optionName: any) => {
    const checked = e.target.checked;
    setValue(optionName, checked);
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={() => setShowSidepanel(false)}
      title={
        <span className="text-base font-semibold uppercase">
          <Translate>Stats & Filters</Translate>
        </span>
      }
    >
      <form onSubmit={handleSubmit(submitFilters)} className="flex flex-col h-full">
        <div className="flex flex-col flex-grow gap-4">
          <Card title={header(t('System', 'Labeled'), aggregation.labeled._count)}>
            <div className="mx-4 mb-3 space-y-1">
              <div className="flex items-center space-x-1 bg-green-300">
                <div className="flex-none">
                  <Translate>Accuracy</Translate>
                </div>
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">80%</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="Match"
                  {...register('labeled.match')}
                  onChange={e => {
                    checkOption(e, 'labeled.match');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.labeled.match}</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="Mismatch"
                  {...register('labeled.mismatch')}
                  onChange={e => {
                    checkOption(e, 'labeled.mismatch');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.labeled.mismatch}</div>
              </div>
            </div>
          </Card>
          <Card title={header(t('System', 'Non-labeled'), aggregation.nonLabeled._count)}>
            <div className="mx-4 mb-3 space-y-1">
              <div className="flex items-center space-x-1 bg-yellow-200">
                <div className="flex-none">
                  <Translate>Pending</Translate>
                </div>
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">10%</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="No suggestion"
                  {...register('nonLabeled.noSuggestion')}
                  onChange={e => {
                    checkOption(e, 'nonLabeled.noSuggestion');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.nonLabeled.noSuggestion}</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="No context"
                  {...register('nonLabeled.noContext')}
                  onChange={e => {
                    checkOption(e, 'nonLabeled.noContext');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.nonLabeled.noContext}</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="Obsolete"
                  {...register('nonLabeled.obsolete')}
                  onChange={e => {
                    checkOption(e, 'nonLabeled.obsolete');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.nonLabeled.obsolete}</div>
              </div>
              <div className="flex items-center space-x-1 text-indigo-700">
                <Checkbox
                  label="Others"
                  {...register('nonLabeled.others')}
                  onChange={e => {
                    checkOption(e, 'nonLabeled.others');
                  }}
                />
                <div className="flex-1 border-t border-dashed border-t-gray-200" />
                <div className="flex-none">{aggregation.nonLabeled.others}</div>
              </div>
            </div>
          </Card>
        </div>
        <div className="flex gap-2">
          <Button
            className="flex-grow"
            type="button"
            styling="outline"
            onClick={() => {
              reset(defaultFilter);
            }}
          >
            <Translate>Clear all</Translate>
          </Button>
          <Button className="flex-grow" type="submit">
            <Translate>Apply</Translate>
          </Button>
        </div>
      </form>
    </Sidepanel>
  );
};

export { FiltersSidepanel };
