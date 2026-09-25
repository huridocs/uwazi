import React from 'react';
import { useIdleFormValue } from '#V2/CustomHooks/useIdleFormValue.js';
import { useInstalledEntityLanguages } from './useInstalledEntityLanguages.js';
import { useTranslationFieldHandlers } from './useTranslationFieldHandlers.js';
import { MultiLanguageField } from './MultiLanguageField.js';
import { useTranslationServiceAvailability } from './TranslationServiceAvailability.js';

type EntityTranslationFieldProps = {
  propertyName: string;
  label: string;
  idPrefix: string;
  onCurrentChange: (value: string) => void;
  multiline?: boolean;
  messageSlot?: React.ReactNode;
  disabled?: boolean;
};

const EntityTranslationField = React.memo(
  ({
    propertyName,
    label,
    idPrefix,
    onCurrentChange,
    multiline,
    messageSlot,
    disabled,
  }: EntityTranslationFieldProps) => {
    const currentValue = useIdleFormValue(idPrefix);
    const { languages, current, canAutoTranslate } = useInstalledEntityLanguages();
    const { available } = useTranslationServiceAvailability();
    const { onChange, onTranslate, values } = useTranslationFieldHandlers({
      propertyName,
      current,
      currentValue,
      sourceField: idPrefix,
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
        serviceUnavailable={canAutoTranslate && !available}
        multiline={multiline}
        messageSlot={messageSlot}
        disabled={disabled}
      />
    );
  }
);

export { EntityTranslationField };
