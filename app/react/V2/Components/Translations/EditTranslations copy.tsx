/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Params, useLoaderData, LoaderFunction, Link } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { useSetRecoilState } from 'recoil';
import { flatten, toPairs, sortBy, pickBy, pick } from 'lodash';
import { availableLanguages } from 'shared/languagesList';
import { Settings } from 'shared/types/settingsType';
import { Translate } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import { GroupTable } from 'V2/Components/UI/GroupTable';
import { Pill } from 'V2/Components/UI/Pill';
import { NavigationHeader } from 'V2/Components/UI/NavigationHeader';
import { Button } from 'V2/Components/UI/Button';
import { ToggleButton } from 'V2/Components/UI/ToggleButton';
import { InputField } from 'V2/Components/UI/InputField';
import * as translationsAPI from 'V2/api/translations';
import * as settingsAPI from 'V2/api/settings';
import { notificationAtom } from 'V2/atoms';
import { WithRequired } from 'shared/types/commonTypes';

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
  if (!cell.value) {
    return '';
  }

  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.value === 'defaultLanguage') color = 'primary';
  if (cell.value === 'untranslated') color = 'yellow';
  return (
    <Pill key={cell.row.original.locale + cell.row.values.key} color={color}>
      {cell.row.original.locale.toUpperCase()}
    </Pill>
  );
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
        status: formData[languageIndex].values[termIndex].translationStatus,
      },
      fieldKey: `formData.${languageIndex}.values.${termIndex}.value`,
    };
  });

const getTraslationStatus = (
  defaultLanguageValues: { [key: string]: string },
  actualKey: string,
  actualValue: unknown,
  defaultLocale: string,
  currentLocale: string
) => {
  const isUntranslated =
    defaultLanguageValues[actualKey] === actualValue && defaultLocale !== currentLocale;
  const isDefaultLanguage = defaultLocale === currentLocale;

  if (isUntranslated) return 'untranslated';
  if (isDefaultLanguage) return 'defaultLanguage';
  return 'translated';
};

const prepareFormValues = (
  translations: WithRequired<ClientTranslationSchema, 'contexts'>[],
  defaultLanguageKey: string
) => {
  const defaultLanguageValues = translations.find(
    language => language.locale === defaultLanguageKey
  ).contexts[0].values;

  const languageLabel: { [key: string]: string } = availableLanguages.reduce(
    (accum, language) => ({
      ...accum,
      [language.key]: language.localized_label,
    }),
    {}
  );

  const data1 = translations.map(translation =>
    toPairs(translation.contexts[0].values).map(([key, value]) => ({
      key,
      value,
      locale: translation.locale,
      language: languageLabel[translation.locale as string],
      status: getTraslationStatus(
        defaultLanguageValues,
        key,
        value,
        defaultLanguageKey,
        translation.locale
      ),
    }))
  );

  return sortBy(flatten(data1), 'key');
};

// eslint-disable-next-line max-statements
const EditTranslations = () => {
  const { translations, settings } = useLoaderData() as {
    translations: ClientTranslationSchema[];
    settings: Settings;
  };
  const [submitting, setIsSubmitting] = useState(false);
  const [translationsState, setTranslationsState] = useState(translations);
  const [hideTranslated, setHideTranslated] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);

  const defaultLanguage = settings?.languages?.find(language => language.default);
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
    if (cell.isAggregated || cell.isGrouped) {
      return '';
    }
    const reset = () => resetField(`formData.${cell.row.id}.value`, { defaultValue: '' });
    return (
      <div key={cell.value}>
        <InputField
          fieldID={cell.row.id}
          label={`${cell.row.original.key} ${cell.row.original.locale}`}
          hideLabel
          disabled={submitting}
          buttonAction={reset}
          inputControls={{ ...register(`formData.${cell.row.id}.value`, { required: true }) }}
        />
        {/* <ErrorMessage
          errors={errors}
          name={`formData.${cell.row.id}.value`}
          render={() => (
            <p className="font-bold text-error-700" role="alert">
              <Translate>This field is required</Translate>
            </p>
          )}
        /> */}
      </div>
    );
  };

  const columns = [
    {
      id: 'key',
      accessor: 'key',
    },
    {
      Header: 'Language',
      accessor: 'language',
      Aggregated: 'language',
      disableGroupBy: true,
    },
    {
      Header: '',
      accessor: 'status',
      Cell: renderPill,
      id: 'status',
      disableGroupBy: true,
    },
    {
      Header: 'Current Value',
      accessor: 'value',
      Cell: inputField,
      disableGroupBy: true,
    },
  ];

  const submitFunction = async (data: { formData: formDataType }) => {
    setIsSubmitting(true);
    console.log('submitting', submitting);
    //const values = prepareValuesToSave(data.formData, translations);
    // translationsAPI
    //   .post(values)
    //   .then(response => {
    //     setNotifications({ type: 'sucess', text: <Translate>Translations saved</Translate> });
    //     setTranslationsState(response);
    //   })
    //   .catch(e => {
    //     setNotifications({
    //       type: 'error',
    //       text: <Translate>An error occurred</Translate>,
    //       details: e.json.error,
    //     });
    //   })
    //   .finally(() => {
    //     setIsSubmitting(false);
    //   });
  };

  return (
    <div className="tw-content" style={{ width: '100%', overflowY: 'auto' }}>
      <div className="p-5">
        <div className="pb-4">
          <NavigationHeader backUrl="/settings/translations">
            <h1 className="flex gap-2 text-gray-700 text-baseregi sm:gap-6">
              <Translate>Translations</Translate>
              <span>&gt;</span>
              <Translate>system</Translate>
            </h1>
          </NavigationHeader>
        </div>

        <div className="pb-4">
          <ToggleButton onToggle={() => setHideTranslated(!hideTranslated)}>
            <div className="ml-2 text-sm text-gray-700">
              <Translate>Show untranslated terms only</Translate>
            </div>
          </ToggleButton>
        </div>

        <form onSubmit={handleSubmit(submitFunction)}>
          <GroupTable columns={columns} data={formData} initialGroupBy={['key']} />
          <div className="absolute bottom-0 left-0 w-full bg-white border-t border-gray-200 lg:sticky z-1">
            <div className="flex justify-end gap-2 p-2 pt-1">
              {/* <div className="flex-1"> */}
              {/* {contextId === 'System' && (
                  <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
                    <Translate>Import</Translate>
                  </Button>
                )} */}
              {/* </div> */}
              <Button size="small" buttonStyle="tertiary" type="button" disabled={submitting}>
                <Link to="/settings/translations">
                  <Translate>Cancel</Translate>
                </Link>
              </Button>
              <Button size="small" buttonStyle="primary" type="submit" disabled={submitting}>
                <Translate>Save</Translate>
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
