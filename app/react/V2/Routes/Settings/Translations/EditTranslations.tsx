/* eslint-disable react/no-multi-comp */
/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable max-lines */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Params,
  useLoaderData,
  LoaderFunction,
  useBlocker,
  Link,
  ActionFunction,
  useFetcher,
} from 'react-router';
import { InformationCircleIcon } from '@heroicons/react/20/solid';
import { IncomingHttpHeaders } from 'http';
import { useForm } from 'react-hook-form';
import RenderIfVisibleModule from 'react-render-if-visible';
import { t, Translate } from '#app/I18N/index.js';
import { advancedSort } from '#app/utils/advancedSort.js';
import { ClientTranslationSchema } from '#app/istore.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { SettingsContent } from '#V2/Components/Layouts/SettingsContent.js';
import { Button, ToggleButton, ConfirmNavigationModal } from '#V2/Components/UI/index.js';
import { resolveDefaultExport } from '#shared/resolveDefaultExport.js';
import * as translationsAPI from '#V2/api/translations/index.js';
import * as settingsAPI from '#V2/api/settings/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';
import { availableLanguages } from '#shared/language/index.js';
import { Settings } from '#shared/types/settingsType.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { LanguagePill } from './components/LanguagePill.js';

// eslint-disable-next-line react/prop-types -- typed via ComponentType<>
const Fallback: React.ComponentType<{ children: React.ReactNode }> = ({ children }) => (
  <>{children}</>
);
const RenderIfVisible = resolveDefaultExport<React.ComponentType<{ children: React.ReactNode }>>(
  RenderIfVisibleModule,
  Fallback,
  c => typeof c === 'function'
);

const editTranslationsLoader =
  (headers?: IncomingHttpHeaders): LoaderFunction =>
  async ({ params }: { params: Params }) => {
    const translations = await translationsAPI.get(headers, params);
    const [settings] = await settingsAPI.get(headers);
    const sortedTranslations = translations.map(language => {
      const sortedContexts = language.contexts.map(context => {
        const sortedContextKeys = advancedSort(Object.keys(context.values)) as string[];

        const sortedContext = sortedContextKeys.reduce((results, contextKey) => {
          const value = context.values[contextKey];
          return { ...results, [contextKey]: value };
        }, {});

        return { ...context, values: sortedContext };
      });

      return { ...language, contexts: sortedContexts };
    });

    return { translations: sortedTranslations, settings };
  };

const submitTranslations = async (formData: FormData, context?: string) => {
  const values = formData.get('data');
  if (typeof values !== 'string' || !context) return [];
  return translationsAPI.post(JSON.parse(values), context);
};

const uploadTranslations = async (formData: FormData) => {
  const file = formData.get('data');
  if (!(file instanceof File)) return [];
  return translationsAPI.importTranslations(file, 'System');
};

const editTranslationsAction =
  (): ActionFunction =>
  async ({ params, request }) => {
    const formData = await request.formData();
    const formIntent = formData.get('intent');
    if (formIntent === 'form-submit') return submitTranslations(formData, params.context);
    if (formIntent === 'file-upload') return uploadTranslations(formData);
    return [];
  };

type formValuesType = {
  _id?: string;
  locale?: string;
  values: { [index: number]: { [key: string]: string } };
}[];

const prepareValuesToSave = (
  data: formValuesType,
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

const readTranslationValue = (formValues: unknown, languageIndex: number, termIndex: number) => {
  if (!Array.isArray(formValues)) return '';
  const language: unknown = formValues[languageIndex];
  if (typeof language !== 'object' || language === null || !('values' in language)) return '';
  const { values } = language;
  if (typeof values !== 'object' || values === null) return '';
  const entry: unknown = Object.entries(values).find(([key]) => key === String(termIndex))?.[1];
  if (typeof entry !== 'object' || entry === null || !('value' in entry)) return '';
  return typeof entry.value === 'string' ? entry.value : '';
};

const composeTableValues = (formValues: formValuesType, termIndex: number) =>
  formValues.map((language, languageIndex) => {
    const languageLabel = availableLanguages.find(
      availableLanguage => availableLanguage.key === language.locale
    )?.localized_label;
    return {
      language: languageLabel,
      translationStatus: {
        languageKey: language.locale,
        status: formValues[languageIndex].values[termIndex]?.translationStatus || 'untranslated',
      },
      fieldKey: `formValues.${languageIndex}.values.${termIndex}.value`,
      languageIndex,
      termIndex,
    };
  });

const getTranslationStatus = ({
  defaultLanguageValues,
  evaluatedTerm,
  currentLanguageKey,
  defaultLanguageKey,
}: {
  defaultLanguageValues: { [key: string]: string };
  evaluatedTerm: { key: string; value: string };
  currentLanguageKey: string;
  defaultLanguageKey: string;
}) => {
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
    const values = Object.entries(language.contexts[0].values || {}).reduce(
      (result, [key, value], index) => ({
        ...result,
        [index]: {
          key,
          value,
          translationStatus: getTranslationStatus({
            defaultLanguageValues: defaultLanguageValues || {},
            evaluatedTerm: { key, value },
            currentLanguageKey: language.locale,
            defaultLanguageKey,
          }),
        },
      }),
      {}
    );
    return { _id: language._id?.toString(), locale: language.locale, values };
  });
};

const getContextInfo = (translations: ClientTranslationSchema[]) => {
  const [translation] = translations;
  const [context] = translation.contexts;
  const contextTerms = Object.keys(context.values || {});
  const { label: contextLabel, id: contextId } = context;
  return { contextTerms, contextLabel, contextId };
};

const filterTableValues = (values: any[]) =>
  values.filter(value => value.translationStatus.status !== 'translated');

const calculateTableData = (terms: string[], formValues: formValuesType, hideTranslated: boolean) =>
  terms
    .map((term, index) => {
      let values = composeTableValues(formValues, index);
      if (hideTranslated) values = filterTableValues(values);
      if (values.length === 1 && hideTranslated) return undefined;
      return { [term]: values };
    })
    .filter(v => v);

const submitTranslationForm = async (
  fetcher: ReturnType<typeof useFetcher<ClientTranslationSchema[] | FetchResponseError>>,
  data: { formValues: formValuesType },
  translations: ClientTranslationSchema[]
) => {
  const formData = new FormData();
  const values = prepareValuesToSave(data.formValues, translations);
  formData.set('intent', 'form-submit');
  formData.set('data', JSON.stringify(values));
  await fetcher.submit(formData, { method: 'post' });
};

const importTranslationFile = async (
  fetcher: ReturnType<typeof useFetcher<ClientTranslationSchema[] | FetchResponseError>>,
  event: React.ChangeEvent<HTMLInputElement>
) => {
  const file = event.target.files?.[0];
  if (!file) return;
  const formData = new FormData();
  formData.set('intent', 'file-upload');
  formData.set('data', file);
  await fetcher.submit(formData, { method: 'post', encType: 'multipart/form-data' });
};

const useLoadedTranslations = () => {
  const { translations, settings } = useLoaderData() as {
    translations: ClientTranslationSchema[];
    settings: Settings;
  };
  const { contextTerms, contextLabel, contextId } = getContextInfo(translations);
  const defaultLanguageKey = settings?.languages?.find(language => language.default)?.key || 'en';
  return { translations, contextTerms, contextLabel, contextId, defaultLanguageKey };
};

const useTranslationForm = (
  translations: ClientTranslationSchema[],
  defaultLanguageKey: string
) => {
  const defaultFormValues = prepareFormValues(translations, defaultLanguageKey);
  const form = useForm({
    defaultValues: { formValues: defaultFormValues },
    mode: 'onSubmit',
  });
  const isDirty = !!Object.keys(form.formState.dirtyFields).length;
  const liveFormValues = form.watch('formValues');
  const blocker = useBlocker(isDirty && !form.formState.isSubmitting);
  return { defaultFormValues, liveFormValues, blocker, form };
};

const useTranslationFetcher = (
  translations: ClientTranslationSchema[],
  defaultLanguageKey: string,
  reset: (values: { formValues: ReturnType<typeof prepareFormValues> }) => void
) => {
  const fetcher = useFetcher<ClientTranslationSchema[] | FetchResponseError>();
  const { notify } = useRequestStatus();
  const isSubmitting = fetcher.state === 'submitting';

  useEffect(() => {
    switch (true) {
      case fetcher.data instanceof FetchResponseError:
        notify(
          'error',
          t('System', 'An error occurred', null, false),
          undefined,
          fetcher.data.json?.prettyMessage ? fetcher.data.json?.prettyMessage : undefined
        );
        break;

      case fetcher.formData?.get('intent') === 'form-submit':
        notify('success', t('System', 'Translations saved', null, false));
        break;

      case fetcher.formData?.get('intent') === 'file-upload':
        notify('success', t('System', 'Translations imported.', null, false));
        break;

      default:
        break;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data, fetcher.formData]);

  useEffect(() => {
    if (fetcher.data) {
      const updatedFromValues = prepareFormValues(translations, defaultLanguageKey);
      reset({ formValues: updatedFromValues });
    }
    // updater effect, should only trigger when action returns data to update the table
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [translations]);

  return { fetcher, isSubmitting };
};

const useBlockedModal = (blocker: { state: string }, setShowModal: (open: boolean) => void) => {
  useMemo(() => {
    if (blocker.state === 'blocked') setShowModal(true);
  }, [blocker, setShowModal]);
};

const useEditTranslations = () => {
  const loaded = useLoadedTranslations();
  const [hideTranslated, setHideTranslated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formState = useTranslationForm(loaded.translations, loaded.defaultLanguageKey);
  const { fetcher, isSubmitting } = useTranslationFetcher(
    loaded.translations,
    loaded.defaultLanguageKey,
    formState.form.reset
  );
  const tablesData = useMemo(
    () => calculateTableData(loaded.contextTerms, formState.defaultFormValues, hideTranslated),
    [loaded.contextTerms, formState.defaultFormValues, hideTranslated]
  );
  useBlockedModal(formState.blocker, setShowModal);
  return {
    ...loaded,
    hideTranslated,
    setHideTranslated,
    showModal,
    setShowModal,
    fileInputRef,
    tablesData,
    isSubmitting,
    register: formState.form.register,
    handleSubmit: formState.form.handleSubmit,
    setValue: formState.form.setValue,
    getFieldState: formState.form.getFieldState,
    liveFormValues: formState.liveFormValues,
    blocker: formState.blocker,
    formSubmit: async (data: { formValues: formValuesType }) =>
      submitTranslationForm(fetcher, data, loaded.translations),
    importFile: async (event: React.ChangeEvent<HTMLInputElement>) =>
      importTranslationFile(fetcher, event),
  };
};

const EditTranslations = () => {
  const {
    contextLabel,
    contextId,
    hideTranslated,
    setHideTranslated,
    tablesData,
    handleSubmit,
    formSubmit,
    getFieldState,
    liveFormValues,
    register,
    isSubmitting,
    setValue,
    fileInputRef,
    importFile,
    showModal,
    setShowModal,
    blocker,
  } = useEditTranslations();

  return (
    <div className="w-full h-full overflow-y-auto" data-testid="settings-translations-edit">
      <SettingsContent>
        <SettingsContent.Header
          path={new Map([['Translations', '/settings/translations']])}
          title={contextLabel}
          contextId={contextId}
        />
        <SettingsContent.Body>
          <div className="flex items-center w-full gap-4 pt-5 mb-4">
            <div>
              <ToggleButton
                className="px-5 pt-5"
                onToggle={() => setHideTranslated(!hideTranslated)}
              >
                <div className="pl-1 text-sm text-ink-secondary">
                  <Translate>Untranslated Terms</Translate>
                </div>
              </ToggleButton>
            </div>
          </div>
          <div className="grow">
            <form onSubmit={handleSubmit(formSubmit)} id="edit-translations">
              {tablesData?.length ? (
                tablesData?.map(tableData => {
                  if (!tableData) return null;
                  const [title] = Object.keys(tableData);
                  const values = tableData[title];
                  return (
                    <RenderIfVisible key={title}>
                      <div className="relative mb-4 w-full rounded-md border shadow-md border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)]">
                        <table className="w-full text-sm text-left" data-testid="table">
                          {title && (
                            <caption className="p-4 text-left text-base font-semibold text-ink">
                              {title}
                            </caption>
                          )}
                          <thead className="text-xs uppercase text-ink-tertiary bg-(--color-theme-surface-muted)">
                            <tr className="border-b">
                              <th
                                scope="col"
                                className="px-6 py-3"
                                aria-label={t('System', 'Language', null, false)}
                              >
                                <div className="inline-flex">
                                  <Translate>Language</Translate>
                                </div>
                              </th>
                              <th
                                scope="col"
                                className="px-6 py-3"
                                aria-label={t('System', 'Language Code', null, false)}
                              >
                                <div className="inline-flex">
                                  <Translate className="sr-only">Language Code</Translate>
                                </div>
                              </th>
                              <th
                                scope="col"
                                className="w-full px-6 py-3"
                                aria-label={t('System', 'Value', null, false)}
                              >
                                <div className="inline-flex">
                                  <Translate>Value</Translate>
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {values.map(value => {
                              const hasErrors = Boolean(
                                getFieldState(value.fieldKey as any)?.error
                              );
                              const currentValue = readTranslationValue(
                                liveFormValues,
                                value.languageIndex,
                                value.termIndex
                              );
                              return (
                                <tr key={value.fieldKey}>
                                  <td className="px-6 py-2">{value.language}</td>
                                  <td className="px-6 py-2">
                                    <LanguagePill
                                      languageKey={value.translationStatus.languageKey}
                                      status={value.translationStatus.status}
                                    />
                                  </td>
                                  <td className="px-6 py-2">
                                    <InputField
                                      id={value.fieldKey}
                                      hideLabel
                                      disabled={isSubmitting}
                                      {...register(value.fieldKey as any, { required: true })}
                                      value={currentValue}
                                      clearFieldAction={() =>
                                        setValue(value.fieldKey as any, '', { shouldDirty: true })
                                      }
                                      hasErrors={hasErrors}
                                      errorMessage={
                                        hasErrors ? (
                                          <Translate>This field is required</Translate>
                                        ) : (
                                          ''
                                        )
                                      }
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </RenderIfVisible>
                  );
                })
              ) : (
                <div className="flex items-center gap-2 rounded-md border p-4 border-[color-mix(in_srgb,var(--color-theme-border-default)_45%,transparent)] bg-(--color-theme-feedback-info-tint)">
                  <InformationCircleIcon className="w-10 text-(--color-theme-action-primary)" />
                  <span className="text-(--color-theme-action-primary)">
                    <Translate>There are no untranslated terms</Translate>
                  </span>
                </div>
              )}
            </form>
          </div>
        </SettingsContent.Body>
        <SettingsContent.Footer>
          <div className="flex justify-end gap-2">
            <div className="flex-1">
              {contextId === 'System' && (
                <>
                  <Button
                    variant="ghost"
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
                    onChange={importFile}
                  />
                </>
              )}
            </div>
            <Link to="/settings/translations">
              <Button variant="ghost" type="button" disabled={isSubmitting}>
                <Translate>Cancel</Translate>
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} form="edit-translations">
              <Translate>Save</Translate>
            </Button>
          </div>
        </SettingsContent.Footer>
      </SettingsContent>

      {showModal && (
        <ConfirmNavigationModal setShowModal={setShowModal} onConfirm={blocker.proceed} />
      )}
    </div>
  );
};

export { EditTranslations, editTranslationsLoader, editTranslationsAction };
