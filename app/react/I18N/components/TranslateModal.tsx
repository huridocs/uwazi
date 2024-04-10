import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { useForm } from 'react-hook-form';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';
import { InputField } from 'app/V2/Components/Forms';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useRecoilState(inlineEditAtom);
  const [translations, setTranslations] = useRecoilState(translationsAtom);
  const { languages } = useRecoilValue(settingsAtom);

  const defaultValues = {
    formValues: [
      { language: 'en', key: 'library', value: 'Library' },
      { language: 'es', key: 'library', value: 'Biblioteca' },
    ],
  };

  const { register, handleSubmit } = useForm({
    defaultValues,
    mode: 'onSubmit',
  });

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
