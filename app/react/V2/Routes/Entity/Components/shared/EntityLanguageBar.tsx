/* eslint-disable react/no-multi-comp */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { formatLanguageOptionLabel } from '#shared/language/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import { DirtyDiscardModal } from '#V2/Components/UI/index.js';
import {
  useEntityLanguage,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';

type LanguageOptionProps = {
  label: string;
  isActive: boolean;
  disabled: boolean;
  onSelect: () => void;
};

const LanguageOption = ({ label, isActive, disabled, onSelect }: LanguageOptionProps) => (
  <button
    type="button"
    role="option"
    aria-selected={isActive}
    disabled={disabled}
    onClick={onSelect}
    className={`block w-full whitespace-nowrap px-3 py-2 text-left text-xs font-medium transition-colors ${
      isActive ? 'bg-warm text-ink' : 'text-ink-secondary hover:bg-parchment'
    }`}
  >
    {label}
  </button>
);

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isEditing, isDirty, isSaving, cancelEdit } = useMetadataEditing();
  const uiLocale = useAtomValue(localeAtom) || 'en';
  const [open, setOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string>();
  const menuRef = useRef<HTMLDivElement>(null);

  const languageOptions = useMemo(
    () =>
      languages
        .map(lang => ({
          key: lang.key,
          label: formatLanguageOptionLabel(lang.key, uiLocale),
        }))
        .sort((a, b) => a.label.localeCompare(b.label, uiLocale)),
    [languages, uiLocale]
  );

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  if (languages.length < 2) {
    return null;
  }

  const requestLanguage = (nextLanguage: string) => {
    setOpen(false);
    if (nextLanguage === language || isSaving) {
      return;
    }
    if (isEditing && isDirty) {
      setPendingLanguage(nextLanguage);
      return;
    }
    if (isEditing) {
      cancelEdit();
    }
    setLanguage(nextLanguage).catch(() => undefined);
  };

  const discardAndSwitch = () => {
    const nextLanguage = pendingLanguage;
    setPendingLanguage(undefined);
    if (!nextLanguage || isSaving) {
      return;
    }
    cancelEdit();
    setLanguage(nextLanguage).catch(() => undefined);
  };

  const languageDisabled = isLoading || isSaving;

  return (
    <>
      <div ref={menuRef} className="relative shrink-0">
        <button
          type="button"
          aria-label="Language"
          aria-expanded={open}
          disabled={languageDisabled}
          onClick={() => setOpen(value => !value)}
          className="inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-warm ps-2.5 pe-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:opacity-60"
        >
          {formatLanguageOptionLabel(language, uiLocale)}
          <ChevronDownIcon className="size-3.5 text-ink-tertiary" />
        </button>
        {open ? (
          <div
            className="absolute inset-e-0 top-full z-30 mt-1 min-w-full overflow-hidden rounded-md border border-border bg-paper shadow-md"
            role="listbox"
            aria-label="Language selection"
          >
            {languageOptions.map(lang => (
              <LanguageOption
                key={lang.key}
                label={lang.label}
                isActive={lang.key === language}
                disabled={languageDisabled}
                onSelect={() => requestLanguage(lang.key)}
              />
            ))}
          </div>
        ) : null}
      </div>
      {pendingLanguage ? (
        <DirtyDiscardModal
          action="switch"
          onDiscard={discardAndSwitch}
          onCancel={() => setPendingLanguage(undefined)}
        />
      ) : null}
    </>
  );
};

export { EntityLanguageBar };
