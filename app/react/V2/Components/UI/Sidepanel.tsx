/* eslint-disable react/no-multi-comp */
import React, { useId } from 'react';
import { Transition } from '@headlessui/react';
import { useParams } from 'react-router';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useAtomValue } from 'jotai';
import { availableLanguages } from '#shared/language/index.js';
import { Translate } from '#app/I18N/index.js';
import { themeModeAtom } from '#V2/atoms/index.js';

interface SidePanelProps {
  children: JSX.Element | React.ReactNode;
  closeSidepanelFunction: () => any;
  isOpen?: boolean;
  title?: string | React.ReactNode;
  withOverlay?: boolean;
  size?: 'small' | 'medium' | 'large';
}

const sidepanelHeader = (
  closeSidepanelFunction: () => any,
  title?: React.ReactNode,
  titleId?: string
) => (
  <div
    className="mb-2 flex p-4"
    style={{
      color: 'var(--color-theme-text-secondary)',
      backgroundColor: 'var(--color-theme-surface-raised)',
    }}
  >
    <h1 className="text-base font-bold grow" id={titleId}>
      {title}
    </h1>
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
  const titleId = useId();
  const themeMode = useAtomValue(themeModeAtom);

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
      transitionRight = 'md:-translate-x-[600px] lg:-translate-x-[40%]';
      transitionLeft = 'md:-translate-x-[-600px] lg:-translate-x-[-60%]';
      width = 'md:w-[600px] lg:w-[40%]';
      break;

    default:
      break;
  }

  const isRigthToLeft = availableLanguages.find(language => language.key === languageKey)?.rtl;
  const transition = isRigthToLeft ? transitionRight : transitionLeft;
  const contentClasses = 'flex flex-col h-full overflow-y-auto';

  const panelContent = (
    <div className={contentClasses}>
      {sidepanelHeader(closeSidepanelFunction, title, titleId)}
      {children}
    </div>
  );

  if (withOverlay) {
    return (
      <Transition show={isOpen} className="fixed top-0 left-0 z-10 flex w-full h-full max-h-full">
        <Transition.Child
          className="w-full transition-opacity duration-200 ease-in bg-gray-900 md:grow"
          enterFrom="opacity-0"
          enterTo="opacity-50"
          leaveTo="opacity-0"
          onClick={closeSidepanelFunction}
        />
        <Transition.Child
          as="div"
          className={`fixed top-0 right-0 h-full w-full border-l-2 transition duration-200 ease-in transform ${width}`}
          enterFrom={transition}
          enterTo="translate-x-0"
          leaveTo={transition}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? titleId : undefined}
          style={{
            backgroundColor: 'var(--color-theme-surface-page)',
            borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
            colorScheme: themeMode,
          }}
        >
          <aside className="h-full">{panelContent}</aside>
        </Transition.Child>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="div"
      className={`fixed top-0 right-0 z-10 h-full w-full border-l-2 shadow-lg transition duration-200 ease-in transform ${width}`}
      enterFrom={transition}
      enterTo="translate-x-0"
      leaveTo={transition}
      style={{
        backgroundColor: 'var(--color-theme-surface-page)',
        borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
        colorScheme: themeMode,
      }}
    >
      <aside className="h-full">{panelContent}</aside>
    </Transition>
  );
};

Sidepanel.Body = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: String;
}) => <div className={`grow p-4 ${className}`}>{children}</div>;

Sidepanel.Footer = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: String;
}) => (
  <div
    className={`bottom-0 left-0 z-1 w-full ${className}`}
    style={{ backgroundColor: 'var(--color-theme-surface-page)' }}
  >
    {children}
  </div>
);

export type { SidePanelProps };
export { Sidepanel };
