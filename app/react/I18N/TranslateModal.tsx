/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useFieldArray, useForm } from 'react-hook-form';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { Modal } from '#V2/Components/UI/index.js';
import { settingsAtom, translationsAtom, inlineEditAtom } from '#V2/atoms/index.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

import { InputField } from '#V2/Components/Forms/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { get, postV2 } from '#V2/api/translations/index.js';
import { TranslationValue } from '#V2/shared/types.js';
import { ClientTranslationSchema } from '#app/istore.js';
import { t } from './translateFunction.js';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations] = useAtom(translationsAtom);
  const { notify } = useRequestStatus();
  const { languages = [] } = useAtomValue(settingsAtom);
  // SSR only ships the active locale; fetch all languages for this context when editing.
  const [contextTranslations, setContextTranslations] = React.useState<
    ClientTranslationSchema[] | null
  >(null);

  React.useEffect(() => {
    if (!inlineEditState.context) {
      setContextTranslations(null);
      return undefined;
    }

    let cancelled = false;
    get(undefined, { context: inlineEditState.context })
      .then(result => {
        if (!cancelled) {
          setContextTranslations(result);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Fallback to whatever locale was hydrated via SSR.
          setContextTranslations(translations);
        }
      });

    return () => {
      cancelled = true;
    };
    // Intentionally only re-fetch when the edited context changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inlineEditState.context]);

  const translationsForForm = contextTranslations ?? translations;
  const context = translationsForForm
    .flatMap(translation => translation.contexts || [])
    .find(ctx => ctx.id === inlineEditState.context);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<{ data: TranslationValue[] }>({
    mode: 'onSubmit',
  });

  const { fields } = useFieldArray({ control, name: 'data' });

  React.useEffect(() => {
    if (!context || !contextTranslations) {
      return;
    }

    const initialValues = contextTranslations.map(translation => {
      const language = languages.find(lang => lang.key === translation.locale)!;
      const languageContext = translation.contexts.find(c => c.id === context.id);
      const value =
        languageContext?.values[inlineEditState.translationKey] || inlineEditState.translationKey;
      return {
        language: language.key,
        value,
        key: inlineEditState.translationKey,
      };
    });
    reset({ data: initialValues });
  }, [
    context,
    contextTranslations,
    inlineEditState.translationKey,
    languages,
    reset,
  ]);

  const closeModal = () => {
    setInlineEditState({ inlineEdit: true, translationKey: '', context: '' });
  };

  const submit = async ({ data }: { data: TranslationValue[] }) => {
    if (!context) {
      closeModal();
      return;
    }

    if (isDirty) {
      const response = await postV2(data, context);
      if (response === 200) {
        notify('success', t('System', 'Translations saved', null, false));
      }
      if (response instanceof FetchResponseError) {
        const message = response.json?.prettyMessage
          ? response.json.prettyMessage
          : response.message;
        notify('error', t('System', 'An error occurred', null, false), undefined, message);
      }
    }
    closeModal();
  };

  return (
    inlineEditState.context && (
      <div className="tw-content">
        <div className="z-10000 relative">
          <Modal size="xxxl" id="translationsFormModal">
            <form onSubmit={handleSubmit(submit)}>
              <Modal.Header>
                {t('System', 'Translate', 'Translate', false)}
                <Modal.CloseButton onClick={closeModal} disabled={isSubmitting}>
                  {t('System', 'Close', 'Close', false)}
                </Modal.CloseButton>
              </Modal.Header>
              <Modal.Body className="flex flex-col gap-4">
                {fields?.map((field, index) => (
                  <InputField
                    label={
                      <span className="font-normal text-gray-600">
                        {field.language.toUpperCase()}
                      </span>
                    }
                    id={field.id}
                    key={field.id}
                    {...register(`data.${index}.value`, { required: true })}
                    hasErrors={errors.data && errors.data[index] !== undefined}
                    disabled={isSubmitting}
                  />
                ))}
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="ghost"
                  onClick={closeModal}
                  className="grow"
                  data-testid="cancel-button"
                  disabled={isSubmitting}
                >
                  {t('System', 'Cancel', 'Cancel', false)}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="grow"
                  data-testid="save-button"
                  disabled={isSubmitting || !contextTranslations}
                >
                  {t('System', 'Save', 'Save', false)}
                </Button>
              </Modal.Footer>
            </form>
          </Modal>
        </div>
      </div>
    )
  );
};

export { TranslateModal };
