import React from 'react';
import { Transition } from '@headlessui/react';
import { useRecoilValue } from 'recoil';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { sidepanelConfig, sidepanelShow } from 'app/V2/atoms';
import { Translate } from 'app/I18N';

const sidepanelContent = (
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

const Sidepanel = () => {
  const isOpen = useRecoilValue(sidepanelShow);
  const { content, closeSidepanelFunction, title, withOverlay } = useRecoilValue(sidepanelConfig);

  if (withOverlay) {
    return (
      <Transition show={isOpen}>
        <div className="fixed h-full w-full top-0 left-0 flex">
          <Transition.Child
            enter="transition-opacity ease-in duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-50 bg-gray-900 w-0 md:flex-grow"
            onClick={closeSidepanelFunction}
          />
          <Transition.Child
            as="aside"
            enter="transition transform ease-in duration-300"
            enterFrom="-translate-x-1000"
            enterTo="translate-x-0 fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 md:w-[400px]"
          >
            {sidepanelContent(content, closeSidepanelFunction, title)}
          </Transition.Child>
        </div>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="aside"
      enter="transition transform ease-in duration-300"
      enterFrom="-translate-x-1000"
      enterTo="translate-x-0 fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 md:w-[400px]"
      // leave="transition ease duration-300 transform"
      // leaveFrom="translate-x-0 fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 md:w-[400px]"
      // leaveTo="-translate-x-1000"
    >
      {sidepanelContent(content, closeSidepanelFunction, title)}
    </Transition>
  );
};

export { Sidepanel };
