/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';
import { postV2, getV2 } from 'V2/api/translations';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations, setTranslations] = useAtom(translationsAtom);
  const { languages } = useAtomValue(settingsAtom);

  const defaultValues = {
    formValues: [],
  };

  const { register, handleSubmit, setValue } = useForm({
    defaultValues,
    mode: 'onSubmit',
  });

  useEffect(() => {
    if (inlineEditState.context) {
      const formValues = translations.map(translation => {
        const language = languages?.find(lang => lang.key === translation.locale);
        const value = translation.contexts.find(ctx => ctx.id === inlineEditState.context)?.values[
          inlineEditState.translationKey
        ];
        return { language: language?.key, value, key: inlineEditState.translationKey };
      });
      setValue('formValues', formValues);
    }
  }, [inlineEditState, languages, setValue, translations]);

  const submit = async values => {
    const updatedTranslations = await postV2(
      [
        {
          language: 'en',
          value: 'TEST',
          key: 'Filters (FILTERS CONFIGURATION)',
        },
      ],
      {
        type: 'Uwazi UI',
        label: 'User Interface',
        id: 'System',
      }
    );
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
              {defaultValues.formValues.map((language, index) => (
                <InputField
                  label={<span>{language.language.toUpperCase()}</span>}
                  id={`formValues.${index}.value`}
                  // no unique identifiers for these fields
                  // eslint-disable-next-line react/no-array-index-key
                  key={`formValues.${index}.value`}
                  {...register(`formValues.${index}.value`)}
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
