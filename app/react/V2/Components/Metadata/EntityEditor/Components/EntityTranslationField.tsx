import React from 'react';
import { useIdleFormValue } from '#V2/CustomHooks/useIdleFormValue.js';
import { useInstalledEntityLanguages } from './useInstalledEntityLanguages.js';
import type { LinkPart } from '../functions/entityTranslations.js';
import { useTranslationFieldHandlers } from './useTranslationFieldHandlers.js';
import { MultiLanguageField } from './MultiLanguageField.js';
import { useTranslationServiceAvailability } from './TranslationServiceAvailability.js';

type EntityTranslationFieldProps = {
  propertyName: string;
  label: string;
  idPrefix: string;
  onCurrentChange?: (value: string) => void;
  multiline?: boolean;
  messageSlot?: React.ReactNode;
  disabled?: boolean;
  linkPart?: LinkPart;
  linkSource?: string;
  autoTranslate?: boolean;
  paired?: { label: string; idPrefix: string };
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
    linkPart,
    linkSource,
    autoTranslate = true,
    paired,
  }: EntityTranslationFieldProps) => {
    const currentValue = useIdleFormValue(idPrefix);
    const pairedValue = useIdleFormValue(paired?.idPrefix ?? idPrefix);
    const { languages, current, canAutoTranslate } = useInstalledEntityLanguages();
    const { available } = useTranslationServiceAvailability();
    const showTranslate = autoTranslate && canAutoTranslate;
    const { onChange, onTranslate, values } = useTranslationFieldHandlers({
      propertyName,
      current,
      currentValue,
      sourceField: idPrefix,
      onCurrentChange,
      languages,
      linkPart,
      linkSource,
    });
    const pairedHandlers = useTranslationFieldHandlers({
      propertyName,
      current,
      currentValue: pairedValue,
      sourceField: paired?.idPrefix ?? idPrefix,
      languages,
      linkPart: paired ? 'url' : undefined,
      linkSource: paired ? linkSource : undefined,
    });

    if (!current || languages.length < 2) return <>{messageSlot}</>;

    return (
      <MultiLanguageField
        label={label}
        idPrefix={idPrefix}
        languages={languages}
        current={current}
        values={values}
        onChange={onChange}
        onTranslate={showTranslate ? onTranslate : undefined}
        serviceUnavailable={showTranslate && !available}
        multiline={multiline}
        messageSlot={messageSlot}
        disabled={disabled}
        extra={
          paired
            ? {
                label: paired.label,
                idPrefix: paired.idPrefix,
                values: pairedHandlers.values,
                onChange: pairedHandlers.onChange,
              }
            : undefined
        }
      />
    );
  }
);

export { EntityTranslationField };
