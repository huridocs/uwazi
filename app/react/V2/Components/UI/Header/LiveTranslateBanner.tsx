import React, { useLayoutEffect } from 'react';
import { useAtom } from 'jotai';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { inlineEditAtom } from '#V2/atoms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { HeaderIcon } from './headerIcons.js';

const BANNER_HEIGHT = '2.5rem';
const stoppedEdit = { inlineEdit: false, translationKey: '', context: '' };
const closedDialog = { inlineEdit: true, translationKey: '', context: '' };

const dialogIsOpen = (dialog: Element) => {
  if (!(dialog instanceof HTMLElement)) return false;
  if (dialog.hidden || dialog.inert || dialog.getAttribute('aria-hidden') === 'true') return false;
  const style = window.getComputedStyle(dialog);
  return style.display !== 'none' && style.visibility !== 'hidden';
};

const onEscape =
  (setInlineEditState: (value: typeof stoppedEdit) => void) => (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    const dialog = [...document.querySelectorAll('[role="dialog"]')].find(dialogIsOpen);
    if (dialog && dialog.id !== 'translationsFormModal') return;
    event.preventDefault();
    event.stopPropagation();
    setInlineEditState(dialog ? closedDialog : stoppedEdit);
  };

const LiveTranslateBanner = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);

  useLayoutEffect(() => {
    if (!inlineEditState.inlineEdit) return undefined;
    const root = document.documentElement;
    const handleEscape = onEscape(setInlineEditState);
    root.style.setProperty('--live-translate-banner', BANNER_HEIGHT);
    window.addEventListener('keydown', handleEscape, true);
    return () => {
      root.style.removeProperty('--live-translate-banner');
      window.removeEventListener('keydown', handleEscape, true);
    };
  }, [inlineEditState.inlineEdit, setInlineEditState]);

  if (!inlineEditState.inlineEdit) return null;

  return (
    <div
      className="live-translate-banner clear-both flex h-10 w-full shrink-0 items-center gap-3 px-4"
      style={{ height: BANNER_HEIGHT }}
      data-live-translate-banner
      role="region"
      aria-label={t('System', 'Live translate', null, false)}
    >
      <HeaderIcon name="languages" className="shrink-0" />
      <p role="status" className="min-w-0 flex-1 truncate text-xs">
        <span className="font-semibold">
          <Translate>Live translate is on.</Translate>
        </span>{' '}
        <Translate>Click underlined text to translate it.</Translate>
      </p>
      <kbd className="live-translate-esc font-medium text-meta opacity-70" no-translate="true">
        Esc
      </kbd>
      <button
        type="button"
        className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 text-xs font-semibold transition-colors"
        onClick={() => setInlineEditState(stoppedEdit)}
      >
        <XMarkIcon className="h-[13px] w-[13px]" aria-hidden />
        {t('System', 'Turn off live translate', null, false)}
      </button>
    </div>
  );
};

export { LiveTranslateBanner };
