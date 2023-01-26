import { MultiSelect } from 'app/Forms';
import { t, Translate } from 'app/I18N';
import { SidePanel } from 'app/Layout';
import { Icon } from 'app/UI';
import React, { useState } from 'react';

interface TemplateSelectionType {
  _id: string;
  name: string;
  selected: boolean;
}
type TemplateSelectionsType = TemplateSelectionType[];

interface SuggestionStateSelectionType {
  key: string;
  label: string;
  selected: boolean;
}
type SuggestionStateSelectionsType = SuggestionStateSelectionType[];

interface FiltersSidePanelProps {
  open: boolean;
  hideFilters: () => void;
  reset: () => void;
  stateSelection: SuggestionStateSelectionsType;
  templateSelection: TemplateSelectionsType;
}

export const FiltersSidePanel = ({
  open,
  hideFilters,
  reset,
  stateSelection,
  templateSelection,
}: FiltersSidePanelProps) => {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  return (
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
            options={stateSelection}
            value={selectedStates}
            optionsLabel="label"
            optionsValue="key"
            optionsToShow={20}
            onChange={setSelectedStates}
            hideSearch
            showAll
          />
        </div>
        <div>
          <MultiSelect
            options={templateSelection}
            value={selectedTemplates}
            optionsLabel="name"
            optionsValue="_id"
            optionsToShow={20}
            onChange={setSelectedTemplates}
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
};

export type {
  SuggestionStateSelectionType,
  SuggestionStateSelectionsType,
  TemplateSelectionType,
  TemplateSelectionsType,
};
