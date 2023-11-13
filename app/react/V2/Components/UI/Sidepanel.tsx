/* eslint-disable react/no-multi-comp */
import React from 'react';
import { Transition } from '@headlessui/react';
import { useParams } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { availableLanguages } from 'shared/languagesList';
import { Translate } from 'app/I18N';

interface SidePanelProps {
  children: JSX.Element | React.ReactNode;
  closeSidepanelFunction: () => any;
  isOpen?: boolean;
  title?: string | React.ReactNode;
  withOverlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sidepanelHeader = (closeSidepanelFunction: () => any, title?: React.ReactNode) => (
  <div className="flex mb-2 text-gray-500">
    <h1 className="text-base font-bold grow">{title}</h1>
    <button
      type="button"
      className="justify-end"
      data-testid="close-sidepanel"
      onClick={closeSidepanelFunction}
    >
      <span className="sr-only">
        <Translate>Close</Translate>
      </span>
      <XMarkIcon className="w-6" />
    </button>
  </div>
);

// eslint-disable-next-line max-statements
const Sidepanel = ({
  children,
  closeSidepanelFunction,
  isOpen = false,
  title,
  withOverlay,
  size = 'medium',
}: SidePanelProps) => {
  const { lang: languageKey } = useParams();

  let transitionRight = '-translate-x-[500px]';
  let transitionLeft = '-translate-x-[-500px]';
  let width = 'md:w-[500px]';

  switch (size) {
    case 'small':
      transitionRight = '-translate-x-[300px]';
      transitionLeft = '-translate-x-[-300px]';
      width = 'md:w-[300px]';
      break;

    case 'large':
      transitionRight = 'md:-translate-x-[768px] lg:-translate-x-1/2';
      transitionLeft = 'md:-translate-x-[-768px] lg:-translate-x-[-50%]';
      width = 'md:w-[768px] lg:w-1/2';
      break;

    default:
      break;
  }

  const isRigthToLeft = availableLanguages.find(language => language.key === languageKey)?.rtl;
  const transition = isRigthToLeft ? transitionRight : transitionLeft;
  const contentClasses = 'flex flex-col h-full overflow-y-auto';

  if (withOverlay) {
    return (
      <Transition show={isOpen} className="fixed top-0 left-0 z-10 flex w-full h-full">
        <Transition.Child
          className="w-full transition-opacity duration-200 ease-in bg-gray-900 md:flex-grow"
          enterFrom="opacity-0"
          enterTo="opacity-50"
          leaveTo="opacity-0"
          onClick={closeSidepanelFunction}
        />
        <Transition.Child
          as="aside"
          className={`p-4 w-full h-full top-0 right-0 fixed bg-white border-l-2 transition duration-200 ease-in transform ${width}`}
          enterFrom={transition}
          enterTo="translate-x-0"
          leaveTo={transition}
        >
          <div className={contentClasses}>
            {sidepanelHeader(closeSidepanelFunction, title)}
            {children}
          </div>
        </Transition.Child>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="aside"
      className={`fixed top-0 right-0 z-10 p-4 w-full h-full bg-white border-l-2 shadow-lg transition duration-200 ease-in transform ${width}`}
      enterFrom={transition}
      enterTo="translate-x-0"
      leaveTo={transition}
    >
      <div className={contentClasses}>
        {sidepanelHeader(closeSidepanelFunction, title)}
        {children}
      </div>
    </Transition>
  );
};

Sidepanel.Body = ({ children, className }: { children: React.ReactNode; className?: String }) => (
  <div className={`flex-grow ${className}`}>{children}</div>
);

Sidepanel.Footer = ({ children, className }: { children: React.ReactNode; className?: String }) => (
  <div className={`sticky bottom-0 left-0 w-full px-4 py-3 bg-white z-1 ${className}`}>
    {children}
  </div>
);

export type { SidePanelProps };
export { Sidepanel };
