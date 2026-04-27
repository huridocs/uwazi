/* eslint-disable react/no-multi-comp */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Transition } from '@headlessui/react';
import { useParams } from 'react-router';
import { XMarkIcon } from '@heroicons/react/20/solid';
import { useAtomValue } from 'jotai';
import { availableLanguages } from '#shared/language/index.js';
import { Translate } from '#app/I18N/index.js';
import { effectiveThemeModeAtom } from '#V2/atoms/index.js';

interface SidePanelProps {
  children: JSX.Element | React.ReactNode;
  closeSidepanelFunction: () => any;
  isOpen?: boolean;
  title?: string | React.ReactNode;
  withOverlay?: boolean;
  size?: 'small' | 'medium' | 'large';
  panelId?: string;
}

const sidepanelHeader = (
  closeSidepanelFunction: () => any,
  title?: React.ReactNode,
  titleId?: string
) => (
  <div
    className="mb-2 flex justify-between p-4"
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
  panelId,
}: SidePanelProps) => {
  const { lang: languageKey } = useParams();
  const titleId = useId();
  const themeMode = useAtomValue(effectiveThemeModeAtom);
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

    return (
      <Transition
        show={isOpen}
        as="div"
        className={overlayContainerClass}
        style={sidepanelContainerStyle}
      >
        <Transition.Child
          as="div"
          className="w-full transition-opacity duration-200 ease-in md:grow [background-color:var(--color-theme-surface-overlay,var(--color-theme-bg-overlay,rgba(0,0,0,0.5)))]"
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
          <aside
            ref={panelRef}
            id={panelId}
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
      className={`fixed right-0 z-40 w-full border-l-2 shadow-lg transition duration-200 ease-in transform ${width}`}
      enterFrom={transition}
      enterTo="translate-x-0"
      leaveTo={transition}
      style={{
        ...sidepanelContainerStyle,
        backgroundColor: 'var(--color-theme-surface-page)',
        borderColor: 'color-mix(in srgb, var(--color-theme-border-default) 40%, transparent)',
        colorScheme: themeMode,
      }}
    >
      <aside
        ref={panelRef}
        id={panelId}
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
}) => (
  <div
    className={`bottom-0 left-0 z-1 w-full [background-color:var(--color-theme-surface-page)] ${className}`}
  >
    {children}
  </div>
);

export type { SidePanelProps };
export { Sidepanel };
