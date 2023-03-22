/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Params, useLoaderData, LoaderFunction, Link } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { useSetRecoilState } from 'recoil';
import { availableLanguages } from 'shared/languagesList';
import { Settings } from 'shared/types/settingsType';
import { Translate } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { Table } from 'V2/Components/UI/Table';
import { Pill } from 'V2/Components/UI/Pill';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { Button } from 'V2/Components/UI/Button';
import { ToggleButton } from 'V2/Components/UI/ToggleButton';
import * as translationsAPI from 'V2/api/translations';
import * as settingsAPI from 'V2/api/settings';
import { notificationAtom } from 'V2/atoms';

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

const renderPill = ({ cell }) => (
  <Pill color={cell.value.translationStatusColor}>{cell.value.languageKey.toUpperCase()}</Pill>
);

const composeTableValues = (formData: formDataType, termIndex: number) =>
  formData.map((language, languageIndex) => {
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return {
      language: languaLabel,
      translationStatus: {
        languageKey: language.locale,
        translationStatusColor: formData[languageIndex].values[termIndex].translationStatusColor,
      },
      fieldKey: `formData.${languageIndex}.values.${termIndex}.value`,
    };
  });

const getTraslationStatusColor = (
  defaultLanguageValues: { [key: string]: string },
  evaluatedTerm: { key: string; value: string },
  currentLanguageKey: string,
  defaultLanguageKey: string
) => {
  const isUntranslated =
    defaultLanguageValues[evaluatedTerm.key] === evaluatedTerm.value &&
    defaultLanguageKey !== currentLanguageKey;
  const isDefaultLanguage = defaultLanguageKey === currentLanguageKey;

  if (isUntranslated) return 'yellow';
  if (isDefaultLanguage) return 'primary';
  return 'gray';
};

const prepareFormValues = (translations: ClientTranslationSchema[], defaultLanguageKey: string) => {
  const defaultLanguageValues = translations.find(
    language => language.locale === defaultLanguageKey
  ).contexts[0].values;

  return translations.map(language => {
    const values = Object.entries(language.contexts[0].values || {})
      .sort()
      .reduce(
        (result, [key, value], index) => ({
          ...result,
          [index]: {
            key,
            value,
            translationStatusColor: getTraslationStatusColor(
              defaultLanguageValues,
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

// eslint-disable-next-line max-statements
const EditTranslations = () => {
  const { translations, settings } = useLoaderData() as {
    translations: ClientTranslationSchema[];
    settings: Settings;
  };
  const [submitting, setIsSubmitting] = useState(false);
  const [translationsState, setTranslationsState] = useState(translations);
  const setNotifications = useSetRecoilState(notificationAtom);

  const defaultLanguage = settings?.languages?.find(language => language.default);
  const formData = prepareFormValues(translationsState, defaultLanguage?.key || 'en');
  const { contextTerms, contextLabel, contextId } = getContextInfo(translationsState);

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
  } = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
  });

  const inputField = ({ cell }) => {
    const reset = () => resetField(cell.value, { defaultValue: '' });
    const textColor = submitting ? 'text-gray-500' : 'text-gray-900';
    return (
      <div key={cell.value}>
        <div className="flex">
          <label htmlFor={cell.value} className="sr-only">
            {cell.fieldKey}
          </label>
          <input
            type="text"
            id={cell.value}
            {...register(cell.value, { required: true })}
            disabled={submitting}
            className={`${textColor} rounded-none bg-gray-50 border-y border-l border-r-0 border-gray-300 
            rounded-l-lg block flex-1 min-w-0 lg:w-full text-sm p-2.5`}
          />
          <button
            type="button"
            onClick={reset}
            disabled={submitting}
            className={`${textColor} items-center px-3 text-sm bg-gray-50 border-y border-r border-l-0
            border-gray-300 rounded-r-lg inline-flex`}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <ErrorMessage
          errors={errors}
          name={cell.value}
          render={() => (
            <p className="text-error-700 font-bold" role="alert">
              <Translate>This field is required</Translate>
            </p>
          )}
        />
      </div>
    );
  };

  const columns = [
    { key: '1', Header: 'Language', accessor: 'language', disableSortBy: true },
    { key: '2', Header: '', accessor: 'translationStatus', Cell: renderPill, disableSortBy: true },
    {
      key: '3',
      Header: 'Current Value',
      accessor: 'fieldKey',
      Cell: inputField,
      disableSortBy: true,
      className: 'w-full',
    },
  ];

  const submitFunction = async (data: { formData: formDataType }) => {
    setIsSubmitting(true);
    const values = prepareValuesToSave(data.formData, translations);
    translationsAPI
      .post(values)
      .then(response => {
        setNotifications({ type: 'sucess', text: <Translate>Translations saved</Translate> });
        setTranslationsState(response);
      })
      .catch(e => {
        setNotifications({
          type: 'error',
          text: <Translate>An error occurred</Translate>,
          details: e.json.error,
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <div className="p-5">
        <div className="pb-4">
          <NavigationHeader backUrl="/settings/translations">
            <h1 className="text-base text-gray-700 flex gap-2 sm:gap-6">
              <Translate>Translations</Translate>
              <span>&gt;</span>
              <Translate>{contextLabel}</Translate>
            </h1>
          </NavigationHeader>
        </div>

        <div className="pb-4">
          <ToggleButton>
            <div className="text-gray-700 ml-2 text-sm">
              <Translate>Show untranslated terms only</Translate>
            </div>
          </ToggleButton>
        </div>

        <form onSubmit={handleSubmit(submitFunction)}>
          {contextTerms.map((contextTerm, termIndex) => {
            const values = composeTableValues(formData, termIndex);
            return (
              <div key={contextTerm}>
                <Table columns={columns} data={values} title={contextTerm} />
              </div>
            );
          })}

          <div className="absolute lg:sticky bottom-0 left-0 z-1 w-full bg-white border-t border-gray-200">
            <div className="pt-1 flex justify-end gap-2 p-2">
              <div className="flex-1">
                {contextId === 'System' && (
                  <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
                    Import
                  </Button>
                )}
              </div>
              <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
                <Link to="/settings/translations">Cancel</Link>
              </Button>
              <Button size="small" buttonStyle="primary" type="submit" disabled={submitting}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
