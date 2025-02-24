/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useFieldArray, useForm } from 'react-hook-form';
import { FetchResponseError } from 'shared/JSONRequest';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom, notificationAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';
import { Button } from 'V2/Components/UI/Button';
import { TranslationValue } from 'V2/shared/types';
import { postV2 } from 'V2/api/translations';
import { t } from './translateFunction';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations] = useAtom(translationsAtom);
  const setNotifications = useSetAtom(notificationAtom);
  const context = translations[0].contexts.find(ctx => ctx.id === inlineEditState.context)!;
  const { languages = [] } = useAtomValue(settingsAtom);

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
    const initialValues = translations.map(translation => {
      const language = languages.find(lang => lang.key === translation.locale)!;
      const languageContext = translation.contexts.find(c => c.id === context?.id);
      const value =
        languageContext?.values[inlineEditState.translationKey] || inlineEditState.translationKey;
      return {
        language: language.key,
        value,
        key: inlineEditState.translationKey,
      };
    });
    reset({ data: initialValues });
  }, [context, inlineEditState.translationKey, languages, reset, translations]);

  const closeModal = () => {
    setInlineEditState({ inlineEdit: true, translationKey: '', context: '' });
  };

  const submit = async ({ data }: { data: TranslationValue[] }) => {
    if (isDirty) {
      const response = await postV2(data, context);
      if (response === 200) {
        setNotifications({
          type: 'success',
          text: t('System', 'Translations saved', null, false),
        });
      }
      if (response instanceof FetchResponseError) {
        const message = response.json?.prettyMessage
          ? response.json.prettyMessage
          : response.message;
        setNotifications({
          type: 'error',
          text: t('System', 'An error occurred', null, false),
          details: message,
        });
      }
    }
    closeModal();
  };

  return (
    inlineEditState.context && (
      <div className="tw-content">
        <div className="z-[10000] relative">
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
                  styling="light"
                  onClick={closeModal}
                  className="grow"
                  data-testid="cancel-button"
                  disabled={isSubmitting}
                >
                  {t('System', 'Cancel', 'Cancel', false)}
                </Button>
                <Button
                  type="submit"
                  color="primary"
                  className="grow"
                  data-testid="save-button"
                  disabled={isSubmitting}
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
