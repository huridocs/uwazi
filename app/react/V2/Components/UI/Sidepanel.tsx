/* eslint-disable react/no-multi-comp */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Transition } from '@headlessui/react';
import { useParams } from 'react-router';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { availableLanguages } from '#shared/language/index.js';
import { Translate } from '#app/I18N/index.js';

interface SidePanelProps {
  children: JSX.Element | React.ReactNode;
  closeSidepanelFunction: () => any;
  isOpen?: boolean;
  title?: string | React.ReactNode;
  withOverlay?: boolean;
  size?: 'small' | 'medium' | 'large';
  panelId?: string;
  testId?: string;
}

const sidepanelHeader = (
  closeSidepanelFunction: () => any,
  title?: React.ReactNode,
  titleId?: string
) => (
  <div className="flex p-4 mb-2 text-gray-500 justify-between">
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
  panelId,
  testId,
}: SidePanelProps) => {
  const { lang: languageKey } = useParams();
  const titleId = useId();
  const panelRef = useRef<HTMLElement>(null);
  const previousFocusedElement = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

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
  const focusableSelector =
    'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

  useEffect(() => {
    if (isOpen) {
      previousFocusedElement.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;

      requestAnimationFrame(() => {
        const panel = panelRef.current;
        if (!panel) return;
        const firstFocusable = panel.querySelector<HTMLElement>(focusableSelector);
        (firstFocusable ?? panel).focus();
      });
      return;
    }

    if (previousFocusedElement.current) {
      previousFocusedElement.current.focus();
      previousFocusedElement.current = null;
    }
  }, [isOpen, focusableSelector]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      closeSidepanelFunction();
    };

    document.addEventListener('keydown', onDocumentKeyDown);
    return () => document.removeEventListener('keydown', onDocumentKeyDown);
  }, [closeSidepanelFunction, isOpen]);

  useEffect(() => {
    const getRenderedHeader = () =>
      document.querySelector<HTMLElement>('.content > .tw-content > header') ||
      document.querySelector<HTMLElement>('.content > header');

    const measureHeader = () => {
      const renderedHeader = getRenderedHeader();
      setHeaderHeight(renderedHeader ? renderedHeader.getBoundingClientRect().height : 0);
    };

    measureHeader();
    window.addEventListener('resize', measureHeader);

    const renderedHeader = getRenderedHeader();
    if (!renderedHeader || typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', measureHeader);
    }

    const resizeObserver = new ResizeObserver(() => {
      measureHeader();
    });

    resizeObserver.observe(renderedHeader);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureHeader);
    };
  }, []);

  const handlePanelKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeSidepanelFunction();
      return;
    }

    if (event.key !== 'Tab') return;
    const panel = panelRef.current;
    if (!panel) return;

    const focusableElements = Array.from(
      panel.querySelectorAll<HTMLElement>(focusableSelector)
    ).filter(
      element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true'
    );

    if (focusableElements.length === 0) {
      event.preventDefault();
      panel.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    const activeElement = document.activeElement;

    if (event.shiftKey && activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  const panelContent = (
    <div className={contentClasses}>
      {sidepanelHeader(closeSidepanelFunction, title, titleId)}
      {children}
    </div>
  );
  const sidepanelContainerStyle = {
    top: `${headerHeight}px`,
    height: `calc(100vh - ${headerHeight}px)`,
  };

  if (withOverlay) {
    const overlayContainerClass = 'fixed left-0 z-10 flex w-full max-h-full';
    const overlayPanelClass = `w-full h-full top-0 right-0 absolute bg-white border-l-2 transition duration-200 ease-in transform ${width}`;

    return (
      <Transition
        show={isOpen}
        as="div"
        className={overlayContainerClass}
        style={sidepanelContainerStyle}
      >
        <Transition.Child
          as="div"
          className="w-full transition-opacity duration-200 ease-in bg-gray-900 md:grow"
          enterFrom="opacity-0"
          enterTo="opacity-50"
          leaveTo="opacity-0"
          onClick={closeSidepanelFunction}
        />
        <Transition.Child
          as="div"
          className={overlayPanelClass}
          enterFrom={transition}
          enterTo="translate-x-0"
          leaveTo={transition}
        >
          <aside
            ref={panelRef}
            id={panelId}
            data-testid={testId}
            tabIndex={-1}
            className="h-full"
            aria-labelledby={title ? titleId : undefined}
            onKeyDown={handlePanelKeyDown}
          >
            {panelContent}
          </aside>
        </Transition.Child>
      </Transition>
    );
  }

  return (
    <Transition
      show={isOpen}
      as="div"
      className={`fixed right-0 z-40 w-full bg-white border-l-2 shadow-lg transition duration-200 ease-in transform ${width}`}
      enterFrom={transition}
      enterTo="translate-x-0"
      leaveTo={transition}
      style={sidepanelContainerStyle}
    >
      <aside
        ref={panelRef}
        id={panelId}
        data-testid={testId}
        tabIndex={-1}
        className="h-full"
        aria-labelledby={title ? titleId : undefined}
        onKeyDown={handlePanelKeyDown}
      >
        {panelContent}
      </aside>
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
}) => <div className={`bottom-0 left-0 w-full bg-white z-1 ${className}`}>{children}</div>;

export type { SidePanelProps };
export { Sidepanel };
