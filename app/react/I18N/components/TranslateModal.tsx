import React, { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations, setTranslations] = useAtom(translationsAtom);
  const { languages } = useAtomValue(settingsAtom);

  const defaultValues = {
    formValues: [
      { language: 'en', key: 'library', value: 'Library' },
      { language: 'es', key: 'library', value: 'Biblioteca' },
    ],
  };

  const { register, handleSubmit, setValue } = useForm({
    defaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (inlineEditState.context) {
      const formValues = translations.map(translation => {
        const language = languages.find(lang => lang.key === translation.locale);
        const value = translation.contexts.find(ctx => ctx.id === inlineEditState.context)?.values[
          inlineEditState.translationKey
        ];
        return { language: language.key, value, key: inlineEditState.translationKey };
      });
      setValue('formValues', formValues);
    }
  }, [inlineEditState]);

  const submit = values => {
    console.log(values);
  };

  return (
    inlineEditState.context && (
      <div className="tw-content">
        <Modal size="xxxl">
          <Modal.Header>Translate!</Modal.Header>
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
              {defaultValues.formValues.map((language, index) => {
                return (
                  <InputField
                    label={<span>{language.language.toUpperCase()}</span>}
                    id={`formValues.${index}.value`}
                    {...register(`formValues.${index}.value`)}
                  />
                );
              })}
              <button type="submit">Save</button>
            </form>
          </Modal.Body>
        </Modal>
      </div>
    )
  );
};

export { TranslateModal };
