/* eslint-disable max-lines */
import React, { useMemo, useRef, useState } from 'react';
import {
  Params,
  useLoaderData,
  LoaderFunction,
  unstable_useBlocker as useBlocker,
  Link,
} from 'react-router-dom';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { useSetRecoilState } from 'recoil';
import { availableLanguages } from 'shared/languagesList';
import { Settings } from 'shared/types/settingsType';
import { Translate } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { Button, NavigationHeader, ToggleButton } from 'V2/Components/UI';
import * as translationsAPI from 'V2/api/translations';
import * as settingsAPI from 'V2/api/settings';
import { notificationAtom } from 'V2/atoms';
import { ConfirmNavigationModal } from 'app/V2/Components/Forms';
import { TranslationsTables } from './components/TranslationsTables';

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }: { params: Params }) => {
    const translations = await translationsAPI.get(headers, params);
    const settings = await settingsAPI.get(headers);
    return { translations, settings };
  };

type formDataType = {
  _id?: string;
  locale?: string;
  values: { [index: number]: { [key: string]: string } };
}[];

const prepareValuesToSave = (
  data: formDataType,
  currentTranslations: ClientTranslationSchema[]
): ClientTranslationSchema[] =>
  data.map((language, index) => {
    const values = Object.values(language.values).reduce(
      (result, value) => ({
        ...result,
        [value.key]: value.value,
      }),
      {}
    );
    return {
      ...currentTranslations[index],
      contexts: [{ ...currentTranslations[index].contexts[0], values }],
    };
  });

const composeTableValues = (formData: formDataType, termIndex: number) =>
  formData.map((language, languageIndex) => {
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return {
      language: languaLabel,
      translationStatus: {
        languageKey: language.locale,
        status: formData[languageIndex].values[termIndex]?.translationStatus || 'untranslated',
      },
      fieldKey: `formData.${languageIndex}.values.${termIndex}.value`,
    };
  });

const getTraslationStatus = (
  defaultLanguageValues: { [key: string]: string },
  evaluatedTerm: { key: string; value: string },
  currentLanguageKey: string,
  defaultLanguageKey: string
) => {
  const isUntranslated =
    defaultLanguageValues[evaluatedTerm.key] === evaluatedTerm.value &&
    defaultLanguageKey !== currentLanguageKey;
  const isDefaultLanguage = defaultLanguageKey === currentLanguageKey;

  if (isUntranslated) return 'untranslated';
  if (isDefaultLanguage) return 'defaultLanguage';
  return 'translated';
};

const prepareFormValues = (translations: ClientTranslationSchema[], defaultLanguageKey: string) => {
  const defaultLanguageValues = translations.find(
    language => language.locale === defaultLanguageKey
  )?.contexts[0].values;

  return translations.map(language => {
    const values = Object.entries(language.contexts[0].values || {})
      .sort()
      .reduce(
        (result, [key, value], index) => ({
          ...result,
          [index]: {
            key,
            value,
            translationStatus: getTraslationStatus(
              defaultLanguageValues || {},
              { key, value },
              language.locale,
              defaultLanguageKey
            ),
          },
        }),
        {}
      );
    return { _id: language._id?.toString(), locale: language.locale, values };
  });
};

const getContextInfo = (translations: ClientTranslationSchema[]) => {
  const contextTerms = Object.keys(translations[0].contexts[0].values || {}).sort();
  const { label: contextLabel, id: contextId } = translations[0].contexts[0];
  return { contextTerms, contextLabel, contextId };
};

const filterTableValues = (values: any[]) =>
  values.filter(value => value.translationStatus.status !== 'translated');

const calculateTableData = (terms: string[], formData: formDataType, hideTranslated: boolean) =>
  terms
    .map((term, index) => {
      let values = composeTableValues(formData, index);
      if (hideTranslated) values = filterTableValues(values);
      if (values.length === 1 && hideTranslated) return undefined;
      return { [term]: values };
    })
    .filter(v => v);

// eslint-disable-next-line max-statements
const EditTranslations = () => {
  const { translations, settings } = useLoaderData() as {
    translations: ClientTranslationSchema[];
    settings: Settings;
  };

  const [translationsState, setTranslationsState] = useState(translations);
  const [hideTranslated, setHideTranslated] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

  const { contextTerms, contextLabel, contextId } = getContextInfo(translationsState);
  const defaultLanguage = settings?.languages?.find(language => language.default);
  const formData = prepareFormValues(translationsState, defaultLanguage?.key || 'en');

  const {
    register,
    handleSubmit,
    setValue,
    getFieldState,
    reset,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    formState: { isDirty, errors, isSubmitting },
  } = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
  });

  const blocker = useBlocker(isDirty);

  useMemo(() => {
    if (blocker.state === 'blocked') {
      setShowModal(true);
    }
  }, [blocker, setShowModal]);

  const tablesData = calculateTableData(contextTerms, formData, hideTranslated);

  const submitFunction = async (data: { formData: formDataType }) => {
    const values = prepareValuesToSave(data.formData, translations);
    if (values && contextId) {
      try {
        const response = await translationsAPI.post(values, contextId);
        setTranslationsState(response);
        setNotifications({
          type: 'success',
          text: <Translate>Translations saved</Translate>,
        });
        reset({}, { keepValues: true });
      } catch (e) {
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: e.json.error,
        });
      }
    }
  };

  const onFileImported = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const response = await translationsAPI.importTranslations(file, 'System');
        setTranslationsState(response);
        setNotifications({
          type: 'success',
          text: <Translate>Translations imported.</Translate>,
        });
      } catch (e) {
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: e.json.error,
        });
      }
    }
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-translations-edit"
    >
      <div className="flex flex-col h-full">
        <div className="flex-grow px-5 pt-5">
          <div className="pb-4">
            <NavigationHeader backUrl="/settings/translations">
              <h1 className="flex gap-2 text-base text-gray-700 sm:gap-6">
                <Link to="/settings/translations">
                  <Translate className="hover:underline">Translations</Translate>
                </Link>
                <span>&gt;</span>
                <Translate>{contextLabel}</Translate>
              </h1>
            </NavigationHeader>
          </div>

          <div className="pb-4">
            <ToggleButton onToggle={() => setHideTranslated(!hideTranslated)}>
              <div className="ml-2 text-sm text-gray-700">
                <Translate>Untranslated Terms</Translate>
              </div>
            </ToggleButton>
          </div>
          <div className="flex-grow">
            {tablesData.length ? (
              <form onSubmit={handleSubmit(submitFunction)} id="edit-translations">
                <TranslationsTables
                  tablesData={tablesData}
                  submitting={isSubmitting}
                  register={register}
                  setValue={setValue}
                  getFieldState={getFieldState}
                />
              </form>
            ) : (
              <div className="flex items-center gap-2 p-4 border rounded-md border-gray-50 bg-primary-50">
                <InformationCircleIcon className="w-10 text-primary-800" />
                <span className="text-primary-800">
                  <Translate>There are no untranslated terms</Translate>
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1">
          <div className="flex justify-end gap-2 p-2 pt-1">
            <div className="flex-1">
              {contextId === 'System' && (
                <>
                  <Button
                    size="small"
                    buttonStyle="tertiary"
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Translate>Import</Translate>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="text/csv"
                    className="hidden"
                    onChange={onFileImported}
                  />
                </>
              )}
            </div>
            <Link to="/settings/translations">
              <Button size="small" buttonStyle="tertiary" type="button" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>
            <Button
              size="small"
              buttonStyle="primary"
              type="submit"
              disabled={isSubmitting}
              formId="edit-translations"
            >
              <Translate>Save</Translate>
            </Button>
          </div>
        </div>
      </div>
      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
