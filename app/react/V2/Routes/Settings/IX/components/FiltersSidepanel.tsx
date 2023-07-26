/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Translate, t } from 'app/I18N';
import { Card, Sidepanel } from 'V2/Components/UI';

interface FiltersSidepanelProps {
  showSidepanel: boolean;
  setShowSidepanel: React.Dispatch<React.SetStateAction<boolean>>;
}

const header = (label: string, total: number) => {
  return (
    <div className="flex items-center space-x-2 text-indigo-700">
      <div className="flex-none">{label}</div>
      <div className="flex-1 border-t border-dashed border-t-gray-200" />
      <div className="flex-none">{total}</div>
    </div>
  );
};

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
      <form onSubmit={() => {}} className="flex flex-col h-full">
        <div className="flex flex-col flex-grow gap-4">
          <Card title={header(t('System', 'Labeled'), 1000)}>
            <div className="mb-4"></div>
          </Card>
          <Card title={header(t('System', 'Non-labeled'), 98)}>
            <div className="flex flex-col gap-1 w-fit md:with-full md:gap-4 md:flex-row md:justify-start"></div>
          </Card>
        </div>
      </form>
    </Sidepanel>
  );
};

export { FiltersSidepanel };
