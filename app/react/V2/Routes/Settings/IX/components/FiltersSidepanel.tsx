/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Translate } from 'app/I18N';
import { Sidepanel } from 'V2/Components/UI';

interface FiltersSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const FiltersSidepanel = ({ showSidepanel, setShowSidepanel }: FiltersSidepanelProps) => {
  const closeSidepanel = () => {
    setShowSidepanel(false);
  };

  return (
    <Sidepanel
      isOpen={showSidepanel}
      withOverlay
      closeSidepanelFunction={closeSidepanel}
      title={
        <span className="text-base font-semibold uppercase">
          <Translate>Stats & Filters</Translate>
        </span>
      }
    >
      <div>Welcome to stats and filters</div>
    </Sidepanel>
  );
};

export { FiltersSidepanel };
