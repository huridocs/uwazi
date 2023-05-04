import React from 'react';
import { Transition } from '@headlessui/react';
import { useRecoilValue } from 'recoil';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { sidepanelConfig } from 'app/V2/atoms';
import { Translate } from 'app/I18N';

const sidepanelHeader = (closeSidepanelFunction: () => any, title?: React.ReactNode) => (
  <div className="flex mb-2 text-gray-500">
    <h1 className="grow uppercase font-bold text-base">{title}</h1>
    <button
      type="button"
      className="justify-end"
      data-testid="Close sidepanel"
      onClick={closeSidepanelFunction}
    >
      <span className="sr-only">
        <Translate>Close</Translate>
      </span>
      <XMarkIcon className="w-6" />
    </button>
  </div>
);

const Sidepanel = ({ isOpen = false }: { isOpen: boolean }) => {
  const { content, closeSidepanelFunction, title, withOverlay } = useRecoilValue(sidepanelConfig);

  if (withOverlay) {
    return (
      <Transition show={isOpen} className="fixed h-full w-full top-0 left-0 flex z-10">
        <Transition.Child
          className="transition-opacity duration-200 ease-in bg-gray-900 w-0 md:flex-grow"
          enterFrom="opacity-0"
          enterTo="opacity-50"
          leaveTo="opacity-0"
          onClick={closeSidepanelFunction}
        />
        <Transition.Child
          as="aside"
          className="transition transform duration-200 ease-in bg-white border-l-2 px-2 py-4 w-full md:w-[500px]"
          enterFrom="-translate-x-[-500px]"
          enterTo="translate-x-0"
          leaveTo="-translate-x-[-500px]"
        >
          {sidepanelHeader(closeSidepanelFunction, title)}
          <div>{content}</div>
        </Transition.Child>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="aside"
      className="transition transform ease-in duration-200 fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 shadow-lg z-10 md:w-[500px]"
      enterFrom="-translate-x-[-500px]"
      enterTo="translate-x-0"
      leaveTo="-translate-x-[-500px]"
    >
      {sidepanelHeader(closeSidepanelFunction, title)}
      <div>{content}</div>
    </Transition>
  );
};

export { Sidepanel };
