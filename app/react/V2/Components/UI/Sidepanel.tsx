import React from 'react';
import { Transition } from '@headlessui/react';
import { useParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { availableLanguages } from 'shared/languagesList';
import { Translate } from 'app/I18N';

interface SidePanelProps {
  children: JSX.Element | React.ReactNode;
  isOpen: boolean;
  closeSidepanelFunction: () => any;
  title?: React.ReactNode | string;
  withOverlay?: boolean;
}

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

const Sidepanel = ({
  isOpen = false,
  closeSidepanelFunction,
  title,
  withOverlay,
  children,
}: SidePanelProps) => {
  const { lang: languageKey } = useParams();
  const isRigthToLeft = availableLanguages.find(language => language.key === languageKey)?.rtl;
  const transition = isRigthToLeft ? '-translate-x-[500px]' : '-translate-x-[-500px]';

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
          enterFrom={transition}
          enterTo="translate-x-0"
          leaveTo={transition}
        >
          {sidepanelHeader(closeSidepanelFunction, title)}
          <div>{children}</div>
        </Transition.Child>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="aside"
      className="transition transform ease-in duration-200 fixed h-full w-full top-0 right-0 bg-white border-l-2 px-2 py-4 shadow-lg z-10 md:w-[500px]"
      enterFrom={transition}
      enterTo="translate-x-0"
      leaveTo={transition}
    >
      {sidepanelHeader(closeSidepanelFunction, title)}
      <div>{children}</div>
    </Transition>
  );
};

export { Sidepanel };
