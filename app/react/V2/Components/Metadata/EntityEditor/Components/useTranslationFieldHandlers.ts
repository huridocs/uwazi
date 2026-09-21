import { useCallback } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { t } from '#app/I18N/index.js';
import { translateText } from '#V2/api/translationService/index.js';
import { notify } from '#V2/utils/notifyBridge.js';
import {
  setTranslationText,
  setTranslationTouched,
  stringFromValues,
} from '../functions/entityTranslations.js';
import type { EditEntityFormValues } from '../functions/buildEditEntityDefaultValues.js';

const requestFieldTranslation = async ({
  current,
  currentValue,
  language,
}: {
  current: string;
  currentValue: string;
  language: string;
}) => {
  const [text, error] = await translateText({
    text: currentValue,
    language_from: current,
    language_to: language,
  });
  if (error || !text) {
    notify(t('System', 'An error occurred', null, false), 'error');
    return '';
  }
  return text;
};

const useTranslationFieldHandlers = ({
  propertyName,
  current,
  currentValue,
  onCurrentChange,
  languages,
}: {
  propertyName: string;
  current: string | undefined;
  currentValue: string;
  onCurrentChange: (value: string) => void;
  languages: string[];
}) => {
  const { setValue, getValues } = useFormContext<EditEntityFormValues>();
  const translations = useWatch<EditEntityFormValues, 'translations'>({ name: 'translations' });

  const onChange = useCallback(
    (language: string, value: string) => {
      if (language === current) {
        onCurrentChange(value);
        return;
      }
      setValue(
        'translations',
        setTranslationText({
          translations: getValues('translations') ?? {},
          language,
          propertyName,
          value,
        }),
        { shouldDirty: true }
      );
      setValue(
        'touchedTranslations',
        setTranslationTouched({
          touched: getValues('touchedTranslations') ?? {},
          language,
          propertyName,
        }),
        { shouldDirty: true }
      );
    },
    [current, getValues, onCurrentChange, propertyName, setValue]
  );

  const onTranslate = useCallback(
    async (language: string) => {
      if (!current) return '';
      return requestFieldTranslation({ current, currentValue, language });
    },
    [current, currentValue]
  );

  const values = Object.fromEntries([
    [current ?? '', currentValue],
    ...languages
      .filter(language => language !== current)
      .map(language => [language, stringFromValues(translations?.[language]?.[propertyName])]),
  ]);

  return { onChange, onTranslate, values };
};

export { useTranslationFieldHandlers };
