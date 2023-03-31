/* eslint-disable react/no-multi-comp */
/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable max-lines */
/* eslint-disable react/jsx-props-no-spreading */
import React, { useState } from 'react';
import { Params, useLoaderData, LoaderFunction, Link } from 'react-router-dom';
import { IncomingHttpHeaders } from 'http';
import { useForm, FormProvider, useFormContext, useFieldArray, Controller } from 'react-hook-form';
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
  const formMethods = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
    shouldUnregister: false,
  });

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors },
    control,
  } = formMethods;

  const { fields, remove } = useFieldArray({
    control,
    name: 'formData',
  });

  const EditableCell = ({
    cell,
    value: initialValue,
    row: { index },
    column: { id, accessor },
  }) => {
    if (cell.isAggregated || cell.isGrouped) {
      return <> </>;
    }
    const formContext = useFormContext();
    const { getValues } = formContext;
    const defaultValue = getValues().formData[index].value;

    return (
      <>
        <Controller
          name={`formData[${index}].value`}
          defaultValue={defaultValue}
          rules={{ required: { value: true, message: 'field is required' } }}
          // control={control}
          render={
            ({ field }) => <input {...field} /> // ✅
          }
        />
        {errors?.formData?.[index]?.value?.message}
      </>
    );
  };

  const ValueCell = React.memo(EditableCell);

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
      Cell: ValueCell,
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
      <FormProvider {...formMethods}>
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

          <form noValidate onSubmit={handleSubmit(submitFunction)}>
            <GroupTable columns={columns} data={fields} initialGroupBy={['key']} />
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
      </FormProvider>
    </div>
  );
};

export { EditTranslations, editTranslationsLoader };
