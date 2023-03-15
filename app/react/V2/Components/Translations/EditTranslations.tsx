/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Params, useLoaderData, LoaderFunction } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { availableLanguages } from 'shared/languagesList';
import { t } from 'app/I18N';
import { Table } from 'app/stories/Table';
import { Pill } from 'app/stories/Pill';
import { NavigationHeader } from 'app/stories/NavigationHeader';
import * as translationsAPI from 'V2/api/translations/index';
import { ClientTranslationSchema } from 'app/istore';

type formDataType = {
  _id?: string;
  locale?: string;
  values: {};
}[];

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

const EditTranslations = () => {
  const translations = useLoaderData() as ClientTranslationSchema[];
  const contextTerms = Object.keys(translations[0].contexts[0].values || {}).sort();
  const contextLabel = translations[0].contexts[0].label;

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
    return (
      <div key={cell.value}>
        <label htmlFor={cell.value} className="hidden">
          {cell.fieldKey}
        </label>
        <div className="flex">
          <input
            type="text"
            id={cell.value}
            {...register(cell.value, { required: true })}
            className="rounded-none bg-gray-50 border-y border-l border-r-0 border-gray-300 rounded-l-lg text-gray-900 block flex-1 min-w-0 w-full text-sm p-2.5"
          />
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center px-3 text-sm text-gray-900 bg-gray-50 border-y border-r border-l-0 border-gray-300 rounded-r-lg"
          >
            x
          </button>
        </div>
        <ErrorMessage
          errors={errors}
          name={cell.value}
          render={() => (
            <p className="error" role="alert">
              {t('System', 'This field is required')}
            </p>
          )}
        />
      </div>
    );
  };

  const columns = [
    { key: '1', Header: 'Language', accessor: 'language' },
    { key: '2', Header: '', accessor: 'languageKey', Cell: renderPill },
    { key: '3', Header: 'Current Value', accessor: 'fieldKey', Cell: inputField },
  ];

  const submitFunction = (data: { formData: formDataType }) => {
    console.log(data);
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
          <button type="submit">SEND</button>
        </form>
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
