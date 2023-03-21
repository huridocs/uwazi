/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Params, useLoaderData, LoaderFunction, Link } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { useSetRecoilState } from 'recoil';
import { availableLanguages } from 'shared/languagesList';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { Pill } from 'app/stories/Pill';
import { NavigationHeader } from 'app/stories/NavigationHeader';
import { Button } from 'app/stories/Button';
import { Settings } from 'shared/types/settingsType';
import { ClientTranslationSchema } from 'app/istore';
import * as translationsAPI from 'V2/api/translations';
import * as settingsAPI from 'V2/api/settings';
import { notificationAtom } from 'app/V2/atoms';

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

const renderPill = ({ cell }) => {
  const color = cell.value.isUntranslated ? 'yellow' : 'gray';
  return <Pill color={color}>{cell.value.languageKey.toUpperCase()}</Pill>;
};

const composeTableValues = (formData: formDataType, termIndex: number) =>
  formData.map((language, languageIndex) => {
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return {
      language: languaLabel,
      translationStatus: {
        languageKey: language.locale,
        isUntranslated: formData[languageIndex].values[termIndex].isUntranslated,
      },
      fieldKey: `formData.${languageIndex}.values.${termIndex}.value`,
    };
  });

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
            isUntranslated:
              defaultLanguageValues[key] === value && defaultLanguageKey !== language.locale,
          },
        }),
        {}
      );
    return { _id: language._id?.toString(), locale: language.locale, values };
  });
};

// eslint-disable-next-line max-statements
const EditTranslations = () => {
  const { translations, settings } = useLoaderData() as {
    translations: ClientTranslationSchema[];
    settings: Settings;
  };
  const [translationsState, setTranslationsState] = useState(translations);
  const defaultLanguage = settings?.languages?.find(language => language.default);
  const contextTerms = Object.keys(translationsState[0].contexts[0].values || {}).sort();
  const [submitting, setIsSubmitting] = useState(false);
  const contextLabel = translationsState[0].contexts[0].label;
  const setNotifications = useSetRecoilState(notificationAtom);

  const formData = prepareFormValues(translationsState, defaultLanguage?.key || 'en');

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
            className={`${textColor} rounded-none bg-gray-50 border-y border-l border-r-0 border-gray-300 rounded-l-lg block flex-1 min-w-0 lg:w-full text-sm p-2.5`}
          />
          <button
            type="button"
            onClick={reset}
            disabled={submitting}
            className={`${textColor} items-center px-3 text-sm bg-gray-50 border-y border-r border-l-0 border-gray-300 rounded-r-lg inline-flex`}
          >
            x
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
      <form onSubmit={handleSubmit(submitFunction)}>
        <div className="p-5">
          <NavigationHeader backUrl="/settings/translations">
            <h1 className="text-base text-gray-700 flex gap-2 sm:gap-6">
              <Translate>Translations</Translate>
              <span>&gt;</span>
              <Translate>{contextLabel}</Translate>
            </h1>
          </NavigationHeader>
          {contextTerms.map((contextTerm, termIndex) => {
            const values = composeTableValues(formData, termIndex);
            return (
              <div className="mt-4" key={contextTerm}>
                <Table columns={columns} data={values} title={contextTerm} />
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-0 left-0 z-1 w-full bg-white border-t border-gray-200">
          <div className="pt-1">
            <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
              Import
            </Button>
            <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
              <Link to="translations">Cancel</Link>
            </Button>
            <Button size="small" buttonStyle="primary" type="submit" disabled={submitting}>
              Save
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
