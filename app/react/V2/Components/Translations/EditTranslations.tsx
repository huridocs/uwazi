/* eslint-disable max-lines */
import React, { useMemo, useRef, useState } from 'react';
import { Params, useLoaderData, LoaderFunction, useNavigate } from 'react-router-dom';
import RenderIfVisible from 'react-render-if-visible';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { IncomingHttpHeaders } from 'http';
import { FieldErrors, useForm, UseFormRegister, UseFormResetField } from 'react-hook-form';
import { ErrorMessage } from '@hookform/error-message';
import { SetterOrUpdater, useSetRecoilState } from 'recoil';
import { availableLanguages } from 'shared/languagesList';
import { Settings } from 'shared/types/settingsType';
import { Translate } from 'app/I18N';
import { ClientTranslationSchema } from 'app/istore';
import {
  Table,
  Pill,
  InputField,
  Button,
  Modal,
  NavigationHeader,
  ToggleButton,
} from 'V2/Components/UI';
import * as translationsAPI from 'V2/api/translations';
import * as settingsAPI from 'V2/api/settings';
import { notificationAtom, notificationAtomType, modalAtom, showModalAtom } from 'V2/atoms';

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

const renderPill = ({ cell }: any) => {
  let color: 'gray' | 'primary' | 'yellow' = 'gray';
  if (cell.value.status === 'defaultLanguage') color = 'primary';
  if (cell.value.status === 'untranslated') color = 'yellow';

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

const inputField = (
  { cell }: any,
  {
    register,
    resetField,
    errors,
    submitting,
  }: {
    register: UseFormRegister<any>;
    resetField: UseFormResetField<any>;
    errors: FieldErrors<any>;
    submitting: boolean;
  }
) => {
  const reset = () => resetField(cell.value, { defaultValue: '' });
  return (
    <div key={cell.value}>
      <InputField
        fieldID={cell.value}
        label={cell.row.values.language}
        hideLabel
        disabled={submitting}
        buttonAction={reset}
        inputControls={{ ...register(cell.value, { required: true }) }}
      />
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

const getColumns = (
  register: UseFormRegister<any>,
  resetField: UseFormResetField<any>,
  errors: FieldErrors<any>,
  submitting: boolean
) => [
  { key: '1', Header: 'Language', accessor: 'language', disableSortBy: true },
  { key: '2', Header: '', accessor: 'translationStatus', Cell: renderPill, disableSortBy: true },
  {
    key: '3',
    Header: 'Current Value',
    accessor: 'fieldKey',
    Cell: (data: any) => inputField(data, { register, resetField, errors, submitting }),
    disableSortBy: true,
    className: 'w-full',
  },
];

const submitFunction = async (
  data: { formData: formDataType },
  translations: ClientTranslationSchema[],
  contextId: string,
  setters: {
    setIsSubmitting: (state: boolean) => void;
    setTranslationsState: (state: ClientTranslationSchema[]) => void;
    setNotifications: SetterOrUpdater<notificationAtomType>;
  }
) => {
  setters.setIsSubmitting(true);
  const values = prepareValuesToSave(data.formData, translations);
  if (values && contextId) {
    setters.setIsSubmitting(true);
    try {
      const response = await translationsAPI.post(values, contextId);
      setters.setTranslationsState(response);
      setters.setNotifications({ type: 'sucess', text: <Translate>Translations saved</Translate> });
    } catch (e) {
      setters.setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: e.json.error,
      });
    }
    setters.setIsSubmitting(false);
  }
};

const onFileImported = async (
  event: React.ChangeEvent<HTMLInputElement>,
  setters: {
    setIsSubmitting: (state: boolean) => void;
    setTranslationsState: (state: ClientTranslationSchema[]) => void;
    setNotifications: SetterOrUpdater<notificationAtomType>;
  }
) => {
  const file = event.target.files?.[0];
  if (file) {
    setters.setIsSubmitting(true);
    try {
      const response = await translationsAPI.importTranslations(file, 'System');
      setters.setTranslationsState(response);
      setters.setNotifications({
        type: 'sucess',
        text: <Translate>Translations imported.</Translate>,
      });
    } catch (e) {
      setters.setNotifications({
        type: 'error',
        text: <Translate>An error occurred</Translate>,
        details: e.json.error,
      });
    }
    setters.setIsSubmitting(false);
  }
};

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
  const [submitting, setIsSubmitting] = useState(false);
  const [translationsState, setTranslationsState] = useState(translations);
  const [hideTranslated, setHideTranslated] = useState(false);
  const setNotifications = useSetRecoilState(notificationAtom);
  const setModal = useSetRecoilState(modalAtom);
  const setShowModal = useSetRecoilState(showModalAtom);
  const navigate = useNavigate();

  const { contextTerms, contextLabel, contextId } = useMemo(
    () => getContextInfo(translationsState),
    [translationsState]
  );

  const defaultLanguage = settings?.languages?.find(language => language.default);

  const formData = useMemo(
    () => prepareFormValues(translationsState, defaultLanguage?.key || 'en'),
    [defaultLanguage?.key, translationsState]
  );

  const fileInputRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null);

  const {
    register,
    handleSubmit,
    resetField,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: { formData },
    mode: 'onSubmit',
  });

  const tablesData = calculateTableData(contextTerms, formData, hideTranslated);

  const cancel = () => {
    if (isDirty) {
      setModal({
        size: 'md',
        children: (
          <>
            <Modal.Header>
              <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                <Translate>Discard changes?</Translate>
              </h3>
              <Modal.CloseButton onClick={() => setShowModal(false)} />
            </Modal.Header>
            <Modal.Body>
              <Translate>You have some unsaved changes, do you want to continue?</Translate>
            </Modal.Body>
            <Modal.Footer>
              <Button
                onClick={() => {
                  setShowModal(false);
                  navigate('/settings/translations');
                }}
              >
                <Translate>Discard changes</Translate>
              </Button>
              <Button buttonStyle="tertiary" onClick={() => setShowModal(false)}>
                <Translate>Cacel</Translate>
              </Button>
            </Modal.Footer>
          </>
        ),
      });
      setShowModal(true);
    }
  };

  return (
    <div
      className="tw-content"
      style={{ width: '100%', overflowY: 'auto' }}
      data-testid="settings-translations"
    >
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
          <ToggleButton onToggle={() => setHideTranslated(!hideTranslated)}>
            <div className="text-gray-700 ml-2 text-sm">
              <Translate>Untranslated Terms</Translate>
            </div>
          </ToggleButton>
        </div>

        <form
          onSubmit={handleSubmit(async data =>
            submitFunction(data, translations, contextId || '', {
              setIsSubmitting,
              setTranslationsState,
              setNotifications,
            })
          )}
        >
          {tablesData.length ? (
            tablesData.map(tableData => {
              const [contextTerm] = Object.keys(tableData!);
              return (
                <div key={contextTerm} className="mt-4">
                  <RenderIfVisible>
                    <Table
                      columns={getColumns(register, resetField, errors, submitting)}
                      data={tableData![contextTerm]}
                      title={contextTerm}
                    />
                  </RenderIfVisible>
                </div>
              );
            })
          ) : (
            <div className="flex gap-2 items-center p-4 border rounded-md border-gray-50 bg-primary-50">
              <InformationCircleIcon className="w-10 text-primary-800" />
              <span className="text-primary-800">
                <Translate>There are no untranslated terms</Translate>
              </span>
            </div>
          )}

          <div className="absolute lg:sticky bottom-0 left-0 z-1 w-full bg-white border-t border-gray-200">
            <div className="pt-1 flex justify-end gap-2 p-2">
              <div className="flex-1">
                {contextId === 'System' && (
                  <>
                    <Button
                      size="small"
                      buttonStyle="tertiary"
                      type="button"
                      disabled={submitting}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Translate>Import</Translate>
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="text/csv"
                      className="hidden"
                      onChange={async event =>
                        onFileImported(event, {
                          setIsSubmitting,
                          setTranslationsState,
                          setNotifications,
                        })
                      }
                    />
                  </>
                )}
              </div>
              <Button
                onClick={cancel}
                size="small"
                buttonStyle="tertiary"
                type="button"
                disabled={submitting}
              >
                <Translate>Cancel</Translate>
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
