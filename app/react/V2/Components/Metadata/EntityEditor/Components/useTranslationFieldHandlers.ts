import { useCallback, useMemo } from 'react';
import { useFormContext, useWatch, type FieldPath } from 'react-hook-form';
import { translateText } from '#V2/api/translationService/index.js';
import {
  stringFromValues,
  translationTouchedPath,
  translationValuePath,
} from '../functions/entityTranslations.js';
import type { EditEntityFormValues } from '../functions/buildEditEntityDefaultValues.js';
import { useTranslationServiceAvailability } from './TranslationServiceAvailability.js';

const formPath = (path: string) => path as FieldPath<EditEntityFormValues>;

const requestFieldTranslation = async ({
  current,
  currentValue,
  language,
  onUnavailable,
}: {
  current: string;
  currentValue: string;
  language: string;
  onUnavailable: () => void;
}) => {
  const [text, error] = await translateText({
    text: currentValue,
    language_from: current,
    language_to: language,
  });
  if (error || !text) {
    onUnavailable();
    return '';
  }
  return text;
};

const useWatchedTranslationValues = ({
  current,
  currentValue,
  languages,
  propertyName,
}: {
  current: string | undefined;
  currentValue: string;
  languages: string[];
  propertyName: string;
}) => {
  const others = useMemo(
    () => languages.filter(language => language !== current),
    [current, languages]
  );
  const paths = useMemo(
    () => others.map(language => formPath(translationValuePath(language, propertyName))),
    [others, propertyName]
  );
  const watched = useWatch({ name: paths });
  return useMemo(() => {
    const watchedList = Array.isArray(watched) ? watched : [watched];
    return Object.fromEntries([
      [current ?? '', currentValue],
      ...others.map((language, index) => [language, stringFromValues(watchedList[index])]),
    ]);
  }, [current, currentValue, others, watched]);
};

const useTranslationFieldHandlers = ({
  propertyName,
  current,
  currentValue,
  sourceField,
  onCurrentChange,
  languages,
}: {
  propertyName: string;
  current: string | undefined;
  currentValue: string;
  sourceField: string;
  onCurrentChange: (value: string) => void;
  languages: string[];
}) => {
  const { setValue, getValues } = useFormContext<EditEntityFormValues>();
  const { markUnavailable } = useTranslationServiceAvailability();
  const values = useWatchedTranslationValues({
    current,
    currentValue,
    languages,
    propertyName,
  });

  const onChange = useCallback(
    (language: string, value: string) => {
      if (language === current) {
        onCurrentChange(value);
        return;
      }
      const valuePath = formPath(translationValuePath(language, propertyName));
      const touchedPath = formPath(translationTouchedPath(language, propertyName));
      setValue(valuePath, [{ value }], { shouldDirty: true });
      if (!getValues(touchedPath)) {
        setValue(touchedPath, true, { shouldDirty: true });
      }
    },
    [current, getValues, onCurrentChange, propertyName, setValue]
  );

  const onTranslate = useCallback(
    async (language: string) => {
      if (!current) return '';
      return requestFieldTranslation({
        current,
        currentValue: String(getValues(formPath(sourceField)) ?? ''),
        language,
        onUnavailable: markUnavailable,
      });
    },
    [current, getValues, markUnavailable, sourceField]
  );

  return { onChange, onTranslate, values };
};

export { useTranslationFieldHandlers };
