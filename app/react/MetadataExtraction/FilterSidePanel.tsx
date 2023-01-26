import { t, Translate } from 'app/I18N';
import { SidePanel } from 'app/Layout';
import { Icon } from 'app/UI';
import React from 'react';

interface FiltersSidePanelProps {
  open: boolean;
  hideFilters: () => void;
  reset: () => void;
}

export const FiltersSidePanel = ({ open, hideFilters, reset }: FiltersSidePanelProps) => (
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
