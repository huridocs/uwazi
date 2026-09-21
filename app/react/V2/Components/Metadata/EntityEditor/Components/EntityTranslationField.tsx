import React from 'react';
import { useInstalledEntityLanguages } from './useInstalledEntityLanguages.js';
import { useTranslationFieldHandlers } from './useTranslationFieldHandlers.js';
import { MultiLanguageField } from './MultiLanguageField.js';

type EntityTranslationFieldProps = {
  propertyName: string;
  label: string;
  idPrefix: string;
  currentValue: string;
  onCurrentChange: (value: string) => void;
  multiline?: boolean;
  messageSlot?: React.ReactNode;
  disabled?: boolean;
};

const EntityTranslationField = ({
  propertyName,
  label,
  idPrefix,
  currentValue,
  onCurrentChange,
  multiline,
  messageSlot,
  disabled,
}: EntityTranslationFieldProps) => {
  const { languages, current, canAutoTranslate } = useInstalledEntityLanguages();
  const { onChange, onTranslate, values } = useTranslationFieldHandlers({
    propertyName,
    current,
    currentValue,
    onCurrentChange,
    languages,
  });

  if (!current || languages.length < 2) return messageSlot ?? null;

  return (
    <MultiLanguageField
      label={label}
      idPrefix={idPrefix}
      languages={languages}
      current={current}
      values={values}
      onChange={onChange}
      onTranslate={canAutoTranslate ? onTranslate : undefined}
      multiline={multiline}
      messageSlot={messageSlot}
      disabled={disabled}
    />
  );
};

export { EntityTranslationField };
