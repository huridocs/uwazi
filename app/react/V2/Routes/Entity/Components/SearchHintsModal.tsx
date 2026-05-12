import React from 'react';
import { useAtom } from 'jotai';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { Translate, t } from '#app/I18N/index.js';
import { searchHintsModalAtom } from './atoms.js';

const SearchHintsModal = () => {
  const [showModal, setShowModal] = useAtom(searchHintsModalAtom);

  return showModal ? (
    <Modal size="xl">
      <Modal.Header>
        <Translate className="text-xl font-medium text-(--color-theme-text-primary)">
          Search Tips
        </Translate>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body className="max-w-[100vw]">
        <div>
          <Translate className="text-lg">Narrow down your searches</Translate>
          <ul className="list-disc list-inside py-4">
            <li className="mb-2">{t('System', 'Search Tips: wildcard', null, false)}</li>
            <li className="mb-2">{t('System', 'Search Tips: one char wildcard', null, false)}</li>
            <li className="mb-2">{t('System', 'Search Tips: exact term', null, false)}</li>
            <li className="mb-2">{t('System', 'Search Tips: proximity', null, false)}</li>
            <li className="mb-2">{t('System', 'Search Tips: boolean', null, false)}</li>
          </ul>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button className="grow" variant="ghost" onClick={() => setShowModal(false)}>
          <Translate>Close</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  ) : null;
};

export { SearchHintsModal };
