import React from 'react';
import { useRecoilValue } from 'recoil';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { sidepanelConfig, sidepanelShow } from 'app/V2/atoms';
import { Translate } from 'app/I18N';

const renderSidepanelContent = (
  content: React.ReactNode,
  closeSidepanelFunction: () => any,
  title?: React.ReactNode
) => (
  <>
    <div className="flex mb-2 text-gray-500">
      <h1 className="grow uppercase font-bold">{title}</h1>
      <button
        type="button"
        className="justify-end"
        data-testid="Close sidepanel"
        onClick={closeSidepanelFunction}
      >
        <span className="sr-only">
          <Translate>Close</Translate>
        </span>
        <XMarkIcon className="w-5" />
      </button>
    </div>
    <div>{content}</div>
  </>
);

// eslint-disable-next-line max-statements
const Sidepanel = () => {
  const isOpen = useRecoilValue(sidepanelShow);
  const { content, closeSidepanelFunction, title, withOverlay } = useRecoilValue(sidepanelConfig);

  if (isOpen && withOverlay) {
    return (
      <div className="fixed h-full w-full top-0 left-0 flex">
        <div className="bg-gray-900 bg-opacity-50 w-0 md:flex-grow" />
        <aside className="bg-white w-full border-l-2 px-2 py-4 md:w-[400px]">
          {renderSidepanelContent(content, closeSidepanelFunction, title)}
        </aside>
      </div>
    );
  }

  if (isOpen) {
    return (
      <aside className="fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 md:w-[400px]">
        {renderSidepanelContent(content, closeSidepanelFunction, title)}
      </aside>
    );
  }

  return <div />;
};

export { Sidepanel };
