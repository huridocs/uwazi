/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { useParams } from 'react-router';
import { Sidepanel } from 'app/V2/Components/UI/Sidepanel';
import { Icon } from 'app/UI';
import { EntityFilter } from './Filters';

type FilterSidePanelProps = {
  availableFilters: { [key: string]: number };
};

const FilterSidePanel = ({ availableFilters }: FilterSidePanelProps) => {
  const params = useParams();
  const [open, setOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<{ [key: string]: boolean }>(
    (typeof params.filters === 'object' && !Array.isArray(params.filters) ? params.filters : {}) as { [key: string]: boolean }
  );

  return (
    <>
      <Button
        className="leading-4 flex gap-2 items-center text-gray-800"
        styling="light"
        onClick={() => setOpen(true)}
      >
        <Icon icon="filter" />
        <Translate>Filters</Translate>
      </Button>
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
          <EntityFilter
            filterGroups={availableFilters}
            loadedFilters={appliedFilters}
            setFilters={(updatedFilters) => {
              setAppliedFilters((prevFilters) => ({
                ...prevFilters,
                ...updatedFilters,
              }));
            }}
          />
        </Sidepanel.Body>
        <Sidepanel.Footer className="px-4 py-3 border-t">
          <div className="flex gap-2 justify-end">
            <Button size="small" styling="outline" onClick={() => console.log('clear all filters')}>
              <Translate>Clear All</Translate>
            </Button>

            <Button size="small" color="success" onClick={() => {
              const searchParams = new URLSearchParams();
              Object.entries(appliedFilters).forEach(([key, value]) => {
                if (value) {
                  searchParams.append(key, value.toString());
                }
              });
              window.location.search = searchParams.toString();
            }}>
              <Translate>Apply</Translate>
            </Button>
          </div>
        </Sidepanel.Footer>
      </Sidepanel>
    </>
  );
};

export { FilterSidePanel };
