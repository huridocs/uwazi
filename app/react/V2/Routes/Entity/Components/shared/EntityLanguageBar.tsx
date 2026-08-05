/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { DirtyDiscardModal } from '#V2/Components/UI/index.js';
import { useEntityLanguage } from '../context/EntityLanguageContext.js';
import { useMetadataEditing } from '../context/MetadataEditingContext.js';

type LanguageOptionProps = {
  langKey: string;
  isActive: boolean;
  disabled: boolean;
  onSelect: () => void;
};

const LanguageOption = ({ langKey, isActive, disabled, onSelect }: LanguageOptionProps) => (
  <button
    type="button"
    role="option"
    aria-selected={isActive}
    disabled={disabled}
    onClick={onSelect}
    className={`block w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
      isActive ? 'bg-warm text-ink' : 'text-ink-secondary hover:bg-parchment'
    }`}
  >
    {langKey.toUpperCase()}
  </button>
);

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isEditing, isDirty, isSaving, cancelEdit } = useMetadataEditing();
  const [open, setOpen] = useState(false);
  const [pendingLanguage, setPendingLanguage] = useState<string>();
  const menuRef = useRef<HTMLDivElement>(null);

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
          className="inline-flex items-center gap-1.5 h-8 rounded-md bg-warm ps-2.5 pe-2 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink disabled:opacity-60"
        >
          {language.toUpperCase()}
          <ChevronDownIcon className="size-3.5 text-ink-tertiary" />
        </button>
        {open ? (
          <div
            className="absolute inset-e-0 top-full z-30 mt-1 min-w-20 overflow-hidden rounded-md border border-border bg-paper shadow-md"
            role="listbox"
            aria-label="Language selection"
          >
            {languages.map(lang => (
              <LanguageOption
                key={lang.key}
                langKey={lang.key}
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
