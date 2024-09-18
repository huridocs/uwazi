/* eslint-disable react/jsx-props-no-spreading */
import React, { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { useFieldArray, useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';
import { postV2, getV2 } from 'V2/api/translations';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useAtom(inlineEditAtom);
  const [translations, setTranslations] = useAtom(translationsAtom);
  const { languages } = useAtomValue(settingsAtom);

  const { register, handleSubmit, control } = useForm({
    mode: 'onSubmit',
  });

  const { replace, fields } = useFieldArray({ control, keyName: 'id', name: 'values' });

  useEffect(() => {
    const values = translations.map(translation => {
      const language = languages?.find(lang => lang.key === translation.locale);
      const value = translation.contexts.find(ctx => ctx.id === inlineEditState.context)?.values[
        inlineEditState.translationKey
      ];
      return {
        language: language?.key,
        value,
        key: inlineEditState.translationKey,
      };
    });
    replace(values);
  }, [inlineEditState.context, inlineEditState.translationKey, languages, replace, translations]);

  const submit = async values => {
    console.log(values);
    // const updatedTranslations = await postV2(
    //   [
    //     {
    //       language: 'en',
    //       value: 'TEST',
    //       key: 'Filters (FILTERS CONFIGURATION)',
    //     },
    //   ],
    //   {
    //     type: 'Uwazi UI',
    //     label: 'User Interface',
    //     id: 'System',
    //   }
    // );
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
                  {...register(`values.${index}.value`)}
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
