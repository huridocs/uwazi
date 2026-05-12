import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtom, useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { Button, Sidepanel } from '#V2/Components/UI/index.js';
import { Extractor } from '#V2/shared/ParagraphExtractionTypes.js';
import { EntityFilter, Filters } from './Filters.js';
import { filterSidepanelAtom, filterSidepanelStatusAtom } from './filterSidepanelAtom.js';

const getFilterStatus = (
  searchParams: object,
  availableFilters?: Extractor['statusCount']
): Filters => {
  const result: Filters = {};

  if (availableFilters) {
    Object.entries(availableFilters).forEach(([key, value]) => {
      const selected =
        Object.hasOwn(searchParams, key) ||
        (searchParams instanceof URLSearchParams && searchParams.getAll('status').includes(key));
      result[key] = { count: value, status: selected };
    });
  }
  delete result.total;
  return result;
};

const EntityFilterSidepanel = () => {
  const filterSidepanelStatus = useAtomValue(filterSidepanelStatusAtom);
  const [searchParams, setSearchParams] = useSearchParams();
  const [open, setOpen] = useAtom(filterSidepanelAtom);
  const [appliedFilters, setAppliedFilters] = useState<Filters>(
    getFilterStatus(searchParams, filterSidepanelStatus as Extractor['statusCount'])
  );

  useEffect(() => {
    const newFilters = getFilterStatus(
      searchParams,
      filterSidepanelStatus as Extractor['statusCount']
    );
    if (newFilters !== appliedFilters) {
      setAppliedFilters(newFilters);
    }
    // avoids infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSidepanelStatus]);

  const handleSubmit = () => {
    setSearchParams((prev: URLSearchParams) => {
      prev.delete('status');
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

  const clearFilters = () => {
    setAppliedFilters(prev => {
      const keys = Object.keys(prev);
      keys.forEach(key => {
        prev[key].status = false;
      });

      return { ...prev };
    });
  };

  return (
    <Sidepanel
      withOverlay
      isOpen={open}
      closeSidepanelFunction={() => {
        setOpen(false);
      }}
      title={
        <span className="text-base font-semibold uppercase leading-6 text-(--color-theme-text-secondary)">
          <Translate>Filters</Translate>
        </span>
      }
    >
      <Sidepanel.Body>
        <EntityFilter filters={appliedFilters} setFilters={setAppliedFilters} />
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3 border-t">
        <form
          className="flex justify-end gap-2"
          onSubmit={(e: any) => {
            e.preventDefault();
            handleSubmit();
          }}
        >
          <Button size="small" variant="secondary" onClick={clearFilters}>
            <Translate>Clear All</Translate>
          </Button>
          <Button size="small" type="submit" variant="success">
            <Translate>Apply</Translate>
          </Button>
        </form>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { EntityFilterSidepanel };
