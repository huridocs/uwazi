import React, { useState } from 'react';
import { useLoaderData, useSearchParams } from 'react-router';
import { useAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, Sidepanel } from 'V2/Components/UI';
import { Extractor, PXEntityLoaderResponse } from 'V2/shared/ParagraphExtractionTypes';
import { EntityFilter, Filters } from './Filters';
import { filterSidepanelAtom } from './filterSidepanelAtom';

const getFilterStatus = (
  searchParams: object,
  availableFilters?: Extractor['statusCount']
): Filters => {
  const result: Filters = {};

  if (availableFilters) {
    Object.entries(availableFilters).forEach(([key, value]) => {
      result[key] = { count: value, status: false };

      if (Object.hasOwn(searchParams, key)) {
        result[key].status = true;
      }
    });
  }

  delete result.total;
  return result;
};

const EntityFilterSidepanel = () => {
  const { extractor } = useLoaderData() as PXEntityLoaderResponse;
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useAtom(filterSidepanelAtom);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() =>
    getFilterStatus(searchParams, extractor?.statusCount)
  );

  const handleSubmit = () => {
    setSearchParams((prev: URLSearchParams) => {
      prev.set('page', '1');
      prev.set('size', '20');
      Object.entries(appliedFilters).forEach(([key, value]) => {
        if (value.status) {
          if (prev.get('status') === null) {
            prev.set('status', key);
          } else {
            prev.append('status', key);
          }
        }
      });

      return prev;
    });

    setOpen(false);
  };

  return (
    <Sidepanel
      withOverlay
      isOpen={open}
      closeSidepanelFunction={() => {
        setOpen(false);
      }}
      title={
        <span className="text-base font-semibold text-gray-500 leading-6 uppercase">
          <Translate>Filters</Translate>
        </span>
      }
    >
      <Sidepanel.Body>
        <EntityFilter filters={appliedFilters} setFilters={setAppliedFilters} />
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3 border-t">
        <div className="flex gap-2 justify-end">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <Button size="small" styling="outline" onClick={() => console.log('clear all filters')}>
              <Translate>Clear All</Translate>
            </Button>
            <Button size="small" type="submit" color="success">
              <Translate>Apply</Translate>
            </Button>
          </form>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { EntityFilterSidepanel };
