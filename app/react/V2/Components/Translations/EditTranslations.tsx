/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Params, useLoaderData, LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { useSetRecoilState } from 'recoil';
import { availableLanguages } from 'shared/languagesList';
import { Translate } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { Pill } from 'app/stories/Pill';
import { NavigationHeader } from 'app/stories/NavigationHeader';
import * as translationsAPI from 'V2/api/translations/index';
import { ClientTranslationSchema } from 'app/istore';
import { notificationAtom } from 'app/V2/atoms';

type formDataType = {
  _id?: string;
  locale?: string;
  values: { [index: number]: { [key: string]: string } };
}[];

const formatValues = (
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

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  ({ params }: { params: Params }) =>
    translationsAPI.get(headers, params);

const renderPill = ({ cell }) => <Pill color="gray">{cell.value.toUpperCase()}</Pill>;

const composeTableValues = (formData: formDataType, termIndex: number) =>
  formData.map((language, languageIndex) => {
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return {
      language: languaLabel,
      languageKey: language.locale,
      fieldKey: `formData.${languageIndex}.values.${termIndex}.value`,
    };
  });

// eslint-disable-next-line max-statements
const EditTranslations = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];
  const contextTerms = Object.keys(translations[0].contexts[0].values || {}).sort();
  const [submitting, setIsSubmitting] = useState(false);
  const contextLabel = translations[0].contexts[0].label;
  const setNotifications = useSetRecoilState(notificationAtom);

  const formData = translations.map(language => {
    const values = Object.entries(language.contexts[0].values || {})
      .sort()
      .reduce(
        (result, [key, value], index) => ({
          ...result,
          [index]: { key, value },
        }),
        {}
      );
    return { _id: language._id?.toString(), locale: language.locale, values };
  });

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
        <label htmlFor={cell.value} className="sr-only">
          {cell.fieldKey}
        </label>
        <div className="flex">
          <input
            type="text"
            id={cell.value}
            {...register(cell.value, { required: true })}
            disabled={submitting}
            className={`${textColor} rounded-none bg-gray-50 border-y border-l border-r-0 border-gray-300 rounded-l-lg block flex-1 min-w-0 w-full text-sm p-2.5`}
          />
          <button
            type="button"
            onClick={reset}
            disabled={submitting}
            className={`${textColor} inline-flex items-center px-3 text-sm bg-gray-50 border-y border-r border-l-0 border-gray-300 rounded-r-lg`}
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
    { key: '2', Header: '', accessor: 'languageKey', Cell: renderPill, disableSortBy: true },
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
    const values = formatValues(data.formData, translations);
    translationsAPI
      .post(values)
      .then(() => {
        setNotifications({ type: 'sucess', text: <Translate>Translations saved</Translate> });
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
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <NavigationHeader backUrl="/settings/translations">
          <h1 className="text-base text-gray-700">Translations &gt; {contextLabel}</h1>
        </NavigationHeader>
        <form onSubmit={handleSubmit(submitFunction)}>
          {contextTerms.map((contextTerm, termIndex) => {
            const values = composeTableValues(formData, termIndex);
            return (
              <div className="mt-4" key={contextTerm}>
                <Table columns={columns} data={values} title={contextTerm} />
              </div>
            );
          })}
          <button type="submit" disabled={submitting}>
            SEND
          </button>
        </form>
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
