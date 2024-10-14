/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useFieldArray, useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';
import { TranslationValue } from 'V2/shared/types';
import { postV2 } from 'V2/api/translations';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations, setTranslations] = useAtom(translationsAtom);
  const context =
    ((translations && translations[0]?.contexts) || []).find(
      ctx => ctx.id === inlineEditState.context
    ) || ((translations && translations[0]?.contexts) || []).find(ctx => ctx.id === 'System')!;
  const { languages } = useAtomValue(settingsAtom);

  const { register, handleSubmit, control, reset } = useForm<{ data: TranslationValue[] }>({
    mode: 'onSubmit',
  });

  const { fields } = useFieldArray({ control, name: 'data' });

  React.useEffect(() => {
    const initialValues = translations.map(translation => {
      const language = languages?.find(lang => lang.key === translation.locale);
      const value = context?.values[inlineEditState.translationKey];

      return {
        language: language?.key,
        value,
        key: inlineEditState.translationKey,
      };
    });
    reset({ data: initialValues });
  }, [context?.values, inlineEditState.translationKey, languages, reset, translations]);

  const submit = async ({ data }: { data: TranslationValue[] }) => {
    const updatedTranslations = await postV2(data, context);
    setTranslations(updatedTranslations);
  };

  return (
    inlineEditState.context && (
      <div className="tw-content">
        <Modal size="xxxl">
          <Modal.Header>Translate</Modal.Header>
          <Modal.CloseButton
            onClick={() =>
              setInlineEditState({ inlineEdit: true, translationKey: '', context: '' })
            }
          >
            Close
          </Modal.CloseButton>
          <Modal.Body>
            <p>{inlineEditState.translationKey}</p>

            <form onSubmit={handleSubmit(submit)}>
              {fields?.map((field, index) => (
                <InputField
                  label={<span>{field.language}</span>}
                  id={field.id}
                  key={field.id}
                  {...register(`data.${index}.value`)}
                />
              ))}
              <button type="submit">Save</button>
            </form>
          </Modal.Body>
        </Modal>
      </div>
    )
  );
};

export { TranslateModal };
