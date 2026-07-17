/* eslint-disable react/no-multi-comp */
import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { DirtyDiscardModal } from '#V2/Components/UI/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { useEntityLanguage } from '../context/EntityLanguageContext.js';
import { useMetadataEditing } from '../context/MetadataEditingContext.js';

type LanguageOptionProps = {
  langKey: string;
  isActive: boolean;
  disabled: boolean;
  variant: 'menu' | 'pill';
  onSelect: () => void;
};

const LanguageOption = ({
  langKey,
  isActive,
  disabled,
  variant,
  onSelect,
}: LanguageOptionProps) => {
  const label = langKey.toUpperCase();

  if (variant === 'menu') {
    return (
      <button
        type="button"
        role="option"
        aria-selected={isActive}
        disabled={disabled}
        onClick={onSelect}
        className={`block w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
          isActive ? 'bg-vellum text-ink' : 'text-ink-secondary hover:bg-warm'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <button
      type="button"
      aria-label={`Language: ${label}`}
      aria-pressed={isActive}
      disabled={disabled}
      onClick={onSelect}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-60 ${
        isActive ? 'bg-vellum text-ink' : 'bg-warm text-ink-tertiary hover:text-ink-secondary'
      }`}
    >
      {label}
    </button>
  );
};

const EntityLanguageBar = () => {
  const { language, languages, isLoading, setLanguage } = useEntityLanguage();
  const { isEditing, isDirty, isSaving, cancelEdit } = useMetadataEditing();
  const isMobile = useIsMobile();
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
    if (!nextLanguage) {
      return;
    }
    cancelEdit();
    setLanguage(nextLanguage).catch(() => undefined);
  };

  const languageDisabled = isLoading || isSaving;
  const options = languages.map(lang => (
    <LanguageOption
      key={lang.key}
      langKey={lang.key}
      isActive={lang.key === language}
      disabled={languageDisabled}
      variant={isMobile ? 'menu' : 'pill'}
      onSelect={() => requestLanguage(lang.key)}
    />
  ));

  return (
    <>
      {isMobile ? (
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            aria-label="Language"
            aria-expanded={open}
            disabled={languageDisabled}
            onClick={() => setOpen(value => !value)}
            className="flex items-center gap-1 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment disabled:opacity-60"
          >
            {language.toUpperCase()}
            <ChevronDownIcon className="size-2.5 text-ink-tertiary" />
          </button>
          {open ? (
            <div
              className="absolute inset-e-0 top-full z-30 mt-1 min-w-20 overflow-hidden rounded-md border border-border bg-paper shadow-md"
              role="listbox"
              aria-label="Language selection"
            >
              {options}
            </div>
          ) : null}
        </div>
      ) : (
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label="Language selection"
        >
          {options}
        </div>
      )}
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
