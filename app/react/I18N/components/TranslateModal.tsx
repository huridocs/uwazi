/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useFieldArray, useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';
import { Button } from 'V2/Components/UI/Button';
import { TranslationValue } from 'V2/shared/types';
import { postV2 } from 'V2/api/translations';
import { Translate } from './Translate';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations] = useAtom(translationsAtom);
  const context = translations[0].contexts.find(ctx => ctx.id === inlineEditState.context)!;
  const { languages = [] } = useAtomValue(settingsAtom);

  const { register, handleSubmit, control, reset } = useForm<{ data: TranslationValue[] }>({
    mode: 'onSubmit',
  });

  const { fields } = useFieldArray({ control, name: 'data' });

  React.useEffect(() => {
    const initialValues = translations.map(translation => {
      const language = languages.find(lang => lang.key === translation.locale)!;
      const languageContext = translation.contexts.find(c => c.id === context.id)!;
      const value = languageContext.values[inlineEditState.translationKey];
      return {
        language: language.key,
        value,
        key: inlineEditState.translationKey,
      };
    });
    reset({ data: initialValues });
  }, [context.id, context.values, inlineEditState.translationKey, languages, reset, translations]);

  const closeModal = () => {
    setInlineEditState({ inlineEdit: true, translationKey: '', context: '' });
  };

  const submit = async ({ data }: { data: TranslationValue[] }) => {
    await postV2(data, context!);
    closeModal();
  };

  return (
    inlineEditState.context && (
      <div className="tw-content">
        <Modal size="xxxl">
          <form onSubmit={handleSubmit(submit)}>
            <Modal.Header>
              <Translate>Translate</Translate>
              <Modal.CloseButton onClick={closeModal}>Close</Modal.CloseButton>
            </Modal.Header>
            <Modal.Body>
              {fields?.map((field, index) => (
                <InputField
                  label={
                    <span className="font-normal text-gray-300">
                      {field.language.toUpperCase()}
                    </span>
                  }
                  id={field.id}
                  key={field.id}
                  {...register(`data.${index}.value`)}
                />
              ))}
            </Modal.Body>
            <Modal.Footer>
              <Button
                styling="light"
                onClick={closeModal}
                className="grow"
                data-testid="cancel-button"
              >
                Cancel
              </Button>
              <Button type="submit" color="primary" className="grow" data-testid="save-button">
                Save
              </Button>
            </Modal.Footer>
          </form>
        </Modal>
      </div>
    )
  );
};

export { TranslateModal };
