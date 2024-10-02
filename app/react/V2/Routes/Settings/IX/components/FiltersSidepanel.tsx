/* eslint-disable react/no-multi-comp */
/* eslint-disable max-statements */
/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Translate } from 'app/I18N';
import { Button, Card, Sidepanel } from 'V2/Components/UI';
import { Checkbox } from 'app/V2/Components/Forms';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';

interface FiltersSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
  aggregation: any;
}

interface IXFilters {
  labeled: boolean;
  nonLabeled: boolean;
  match: boolean;
  mismatch: boolean;
  obsolete: boolean;
  error: boolean;
}

const FiltersSidepanel = ({
  showSidepanel,
  setShowSidepanel,
  aggregation,
}: FiltersSidepanelProps) => {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultFilter: IXFilters = {
    labeled: false,
    nonLabeled: false,
    match: false,
    mismatch: false,
    obsolete: false,
    error: false,
  };

  let initialFilters = defaultFilter;

  try {
    if (searchParams.has('filter')) {
      initialFilters = JSON.parse(searchParams.get('filter')!);
    }
  } catch (e) {}

  const { register, handleSubmit, reset, setValue } = useForm({
    values: initialFilters,
    defaultValues: defaultFilter,
  });

  const submitFilters = async (filters: IXFilters) => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set('page', '1');
      prev.set('filter', JSON.stringify(filters));
      return prev;
    });
    setShowSidepanel(false);
  };

  const checkOption = (e: any, optionName: any) => {
    const { checked } = e.target;
    setValue(optionName, checked);
  };

  const clearFilters = () => {
    setSearchParams(prev => {
      prev.delete('filter');
      return prev;
    });
    setShowSidepanel(false);
    reset();
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
        <Sidepanel.Body className="flex flex-col flex-grow gap-4">
          <Card>
            <div className="flex items-center space-x-0.5">
              <Checkbox
                label={<Translate className="font-normal">Labeled</Translate>}
                {...register('labeled')}
                onChange={e => {
                  checkOption(e, 'labeled');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.labeled}</div>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                label={<Translate className="font-normal">Non-labeled</Translate>}
                {...register('nonLabeled')}
                onChange={e => {
                  checkOption(e, 'nonLabeled');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.nonLabeled}</div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center space-x-0.5">
              <Checkbox
                label={<Translate className="font-normal">Match</Translate>}
                {...register('match')}
                onChange={e => {
                  checkOption(e, 'match');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.match}</div>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                label={<Translate className="font-normal">Mismatch</Translate>}
                {...register('mismatch')}
                onChange={e => {
                  checkOption(e, 'mismatch');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.mismatch}</div>
            </div>
          </Card>
          <Card>
            <div className="flex items-center space-x-0.5">
              <Checkbox
                label={<Translate className="font-normal">Obsolete</Translate>}
                {...register('obsolete')}
                onChange={e => {
                  checkOption(e, 'obsolete');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.obsolete}</div>
            </div>
            <div className="flex items-center space-x-1">
              <Checkbox
                label={<Translate className="font-normal">Error</Translate>}
                {...register('error')}
                onChange={e => {
                  checkOption(e, 'error');
                }}
              />
              <div className="flex-1 border-t border-dashed border-t-gray-200" />
              <div className="flex-none font-mono font-bold">{aggregation.error}</div>
            </div>
          </Card>
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3">
          <div className="flex gap-2">
            <Button className="flex-grow" type="button" styling="outline" onClick={clearFilters}>
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

export { FiltersSidepanel };
