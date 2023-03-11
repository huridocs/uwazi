/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Params, useLoaderData, LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useFieldArray, useForm } from 'react-hook-form';
import { availableLanguages } from 'shared/languagesList';
import { Table } from 'app/stories/Table';
import { Pill } from 'app/stories/Pill';
import { NavigationHeader } from 'app/stories/NavigationHeader';
import * as translationsAPI from 'V2/api/translations/index';
import { ClientTranslationSchema } from 'app/istore';

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  ({ params }: { params: Params }) =>
    translationsAPI.get(headers, params);

const renderPill = ({ cell }) => <Pill color="gray">{cell.value.toUpperCase()}</Pill>;

const composeTableValues = (translations: ClientTranslationSchema[], term: string) =>
  translations.map((language, index) => {
    const context = language.contexts[0];
    const value = context.values[term];
    const languaLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;

    return {
      language: languaLabel,
      languageKey: language.locale,
      value: {
        fieldValue: value,
        fieldKey: `translations[${index}].contexts[0].values.${term}`,
        fieldId: term,
      },
    };
  });

const EditTranslations = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];
  const contextTerms = Object.keys(translations[0].contexts[0].values || {}).sort();
  const contextLabel = translations[0].contexts[0].label;

  const { register, handleSubmit, setValue, control } = useForm({
    defaultValues: { translations },
    mode: 'onSubmit',
  });

  const { fields } = useFieldArray({
    control,
    name: 'translations',
    rules: { required: true },
  });

  const inputField = ({ cell }) => {
    const reset = () => setValue(cell.value.fieldKey, '');
    return (
      <div>
        <label htmlFor={cell.value.fieldId} className="hidden">
          {cell.value.fieldKey}
        </label>
        <div className="flex">
          <input
            type="text"
            id={cell.value.fieldId}
            {...register(cell.value.fieldKey)}
            className="rounded-none bg-gray-50 border-y border-l border-r-0 border-gray-300 rounded-l-lg text-gray-900 block flex-1 min-w-0 w-full text-sm p-2.5 focus:ring-blue-500 focus:border-blue-500 focus:border-r"
          />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-50 border-y border-r border-l-0 border-gray-300 rounded-r-lg"
          >
            x
          </button>
        </div>
      </div>
    );
  };

  const columns = [
    { Header: 'Language', accessor: 'language', disableSortBy: true },
    { Header: '', accessor: 'languageKey', Cell: renderPill, disableSortBy: true },
    { Header: 'Current Value', accessor: 'value', Cell: inputField, disableSortBy: true },
  ];

  const submitFunction = data => {
    console.log(data);
  };

  return (
    <div className="tw-content" style={{ width: '100%' }}>
      <div className="p-5">
        <NavigationHeader backUrl="/settings/translations">
          <h1 className="text-base text-gray-700">Translations &gt; {contextLabel}</h1>
        </NavigationHeader>
        <form onSubmit={handleSubmit(submitFunction)}>
          {contextTerms.map(contextTerm => {
            const values = composeTableValues(fields, contextTerm);
            return (
              <div className="mt-4">
                <Table columns={columns} data={values} title={contextTerm} />
              </div>
            );
          })}
          <button type="submit">SEND</button>
        </form>
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
