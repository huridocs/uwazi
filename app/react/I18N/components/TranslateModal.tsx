import React from 'react';
import { useRecoilState } from 'recoil';
import { Modal } from 'V2/Components/UI';
import { inlineEditAtom } from 'V2/atoms';

const TranslateModal = () => {
  const [inlineEditState, setInlineEditState] = useRecoilState(inlineEditAtom);

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
          <Modal.Body>Modal!</Modal.Body>
        </Modal>
      </div>
    )
  );
};

export { TranslateModal };
