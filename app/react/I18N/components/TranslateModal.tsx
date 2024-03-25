import React from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Modal } from 'V2/Components/UI';
import { settingsAtom, translationsAtom, inlineEditAtom } from 'V2/atoms';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useRecoilState(inlineEditAtom);
  const [translations, setTranslations] = useRecoilState(translationsAtom);
  const { languages } = useRecoilValue(settingsAtom);

  console.log(translations);

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
            <p>{inlineEditState.context}</p>
            <p>{inlineEditState.translationKey}</p>
          </Modal.Body>
        </Modal>
      </div>
    )
  );
};

export { TranslateModal };
