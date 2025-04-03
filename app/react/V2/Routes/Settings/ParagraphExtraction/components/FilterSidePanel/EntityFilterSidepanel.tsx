import React, { useState } from 'react';
import { Form, useLoaderData, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAtom } from 'jotai';
import { Translate } from 'app/I18N';
import { Button, Sidepanel } from 'V2/Components/UI';
import { searchParamsFromSearchParams } from 'app/utils/routeHelpers';
import { Extractor, PXEntityLoaderResponse } from 'V2/shared/ParagraphExtractionTypes';
import { EntityFilter, Filters } from './Filters';
import { filterSidepanelAtom } from './filterSidepanelAtom';

const getFilterStatus = (filters, availableFilters?: Extractor['statusCount']): Filters => {
  const result: Filters = {};

  if (availableFilters) {
    Object.entries(availableFilters).forEach(([key, value]) => {
      result[key] = { count: value, status: false };

      if (Object.hasOwn(filters, key)) {
        result[key].status = true;
      }
    });
  }

  delete result.total;
  return result;
};

const EntityFilterSidepanel = () => {
  const { search } = useLocation();
  const { extractor } = useLoaderData() as PXEntityLoaderResponse;
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useAtom(filterSidepanelAtom);
  const urlFilters = searchParamsFromSearchParams(new URLSearchParams(search));
  const [appliedFilters, setAppliedFilters] = useState<Filters>(() =>
    getFilterStatus(urlFilters, extractor?.statusCount)
  );

  const handleSubmit = async () => {
    const searchParams = new URLSearchParams();
    Object.entries(appliedFilters).forEach(([key, value]) => {
      if (value.status) {
        searchParams.append("status", key);
      }
    });
    setSearchParams(searchParams);
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
          <Form method="get" onSubmit={handleSubmit}>
            <Button size="small" styling="outline" onClick={() => console.log('clear all filters')}>
              <Translate>Clear All</Translate>
            </Button>

            <Button size="small" type="submit" color="success">
              <Translate>Apply</Translate>
            </Button>
          </Form>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { EntityFilterSidepanel };
