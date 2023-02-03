import { MultiSelect } from 'app/Forms';
import { t, Translate } from 'app/I18N';
import { SidePanel } from 'app/Layout';
import { Icon } from 'app/UI';
import React from 'react';

interface SuggestionStateOptions {
  key: string;
  label: string;
  results: number;
}

interface FilterDetails {
  options: SuggestionStateOptions[];
  selected: string[];
  setSelection: (values: string[]) => void;
}

interface FiltersSidePanelProps {
  open: boolean;
  hideFilters: () => void;
  reset: () => void;
  states: FilterDetails;
  templates: FilterDetails;
}

export const FiltersSidePanel = ({
  open,
  hideFilters,
  reset,
  states,
  templates,
}: FiltersSidePanelProps) => (
  <SidePanel className="metadata-sidepanel" open={open}>
    <div className="sidepanel-body">
      <div className="sidepanel-title">
        <div>{t('System', 'Filters configuration')}</div>
        <div className="filter-buttons">
          <button
            type="button"
            className="closeSidepanel"
            onClick={hideFilters}
            aria-label="Close side panel"
          >
            <Icon icon="times" />
          </button>
        </div>
      </div>
      <div>
        <MultiSelect
          options={states.options}
          value={states.selected}
          optionsLabel="label"
          optionsValue="key"
          optionsToShow={20}
          onChange={states.setSelection}
          hideSearch
          showAll
        />
      </div>
      <div>
        <MultiSelect
          options={templates.options}
          value={templates.selected}
          optionsLabel="label"
          optionsValue="key"
          optionsToShow={20}
          onChange={templates.setSelection}
          hideSearch
          showAll
        />
      </div>
    </div>
    <div className="sidepanel-footer">
      <button type="button" className="btn btn-default" onClick={reset}>
        <Icon icon="times" />
        <span className="btn-label">
          <Translate>Clear Filters</Translate>
        </span>
      </button>
    </div>
  </SidePanel>
);
