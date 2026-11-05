import { useCallback, useMemo, useRef, useState } from 'react';
import { useAtomValue } from 'jotai';
import { localeAtom } from '#V2/atoms/index.js';
import {
  fileLanguageSelectOptions,
  fileRowShowsLanguage,
  resolveFileLanguage,
} from './fileHelpers.js';
import type { EntityFileRow } from './types.js';

type FileRowDraftPayload = { _id: string; originalname: string; language?: string };

const useResetDraft = (
  row: EntityFileRow,
  setDraftName: (name: string) => void,
  setDraftLanguage: (language: string) => void
) => {
  const rowRef = useRef(row);
  rowRef.current = row;
  return useCallback(() => {
    const { current } = rowRef;
    setDraftName(current.raw.originalname || current.displayName);
    setDraftLanguage(resolveFileLanguage(current.raw.language));
  }, [setDraftLanguage, setDraftName]);
};

const useFileRowDraft = (row: EntityFileRow) => {
  const [draftName, setDraftName] = useState(row.raw.originalname || row.displayName);
  const [draftLanguage, setDraftLanguage] = useState(() => resolveFileLanguage(row.raw.language));
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const locale = useAtomValue(localeAtom);
  const languageOptions = useMemo(() => fileLanguageSelectOptions(locale), [locale]);
  const showLanguage = fileRowShowsLanguage(row);
  const resetDraft = useResetDraft(row, setDraftName, setDraftLanguage);

  const commit = async (
    onSave: (payload: FileRowDraftPayload) => Promise<void>,
    options?: { trimName?: boolean }
  ) => {
    if (!row.raw._id || saving) return;
    setSaving(true);
    try {
      const originalname = options?.trimName ? draftName.trim() || row.displayName : draftName;
      await onSave({
        _id: row.raw._id,
        originalname,
        language: showLanguage ? draftLanguage || undefined : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return {
    draftName,
    setDraftName,
    draftLanguage,
    setDraftLanguage,
    saving,
    nameInputRef,
    languageOptions,
    showLanguage,
    resetDraft,
    commit,
  };
};

export { useFileRowDraft };
export type { FileRowDraftPayload };
