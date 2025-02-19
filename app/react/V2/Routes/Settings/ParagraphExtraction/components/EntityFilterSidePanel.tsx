/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { Button } from 'app/V2/Components/UI';
import { Sidepanel } from 'app/V2/Components/UI/Sidepanel';
import { EntityFilter } from './EntityFilter';
import { useQueryFilter } from '../hooks/useQueryFilter';

type EntityFilterSidePanelProps = {
  availableFilters: any[];
  show: boolean;
  setShow: (show: boolean) => void;
};

const EntityFilterSidePanel = ({ availableFilters, show, setShow }: EntityFilterSidePanelProps) => {
  const { filters, setFilters } = useQueryFilter();
  const [appliedFilters, setAppliedFilters] = useState(filters);

  return (
    <Sidepanel
      withOverlay
      isOpen={show}
      closeSidepanelFunction={() => {
        setShow(false);
      }}
      title={
        <span className="text-base font-semibold text-gray-500 leading-6 uppercase">
          <Translate>Filters</Translate>
        </span>
      }
    >
      <Sidepanel.Body>
        <EntityFilter filterGroups={availableFilters} setFilters={() => {}} />
      </Sidepanel.Body>
      <Sidepanel.Footer className="px-4 py-3 border-t">
        <div className="flex gap-2 justify-end">
          <Button
            size="small"
            styling="outline"
            // onClick={() => setAppliedFilters({})}
          >
            <Translate>Clear All</Translate>
          </Button>

          <Button
            size="small"
            color="success"
            // onClick={() => setFilters(appliedFilters)}
          >
            <Translate>Apply</Translate>
          </Button>
        </div>
      </Sidepanel.Footer>
    </Sidepanel>
  );
};

export { EntityFilterSidePanel };
