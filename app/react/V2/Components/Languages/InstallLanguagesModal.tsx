import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { SetterOrUpdater } from 'recoil';
import { Button, Modal, SearchMultiselect } from 'app/V2/Components/UI';
import { LanguageSchema } from 'shared/types/commonTypes';

type InstallLanguagesModalProps = {
  setShowModal: SetterOrUpdater<boolean>;
  languages: LanguageSchema[];
};

const InstallLanguagesModal = ({ setShowModal, languages }: InstallLanguagesModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const items = languages.map(l => ({ label: l.localized_label || l.label, value: l.key }));

  const install = () => {};

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Install Language</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body>
        <SearchMultiselect
          className="max-h-96 overflow-y-scroll"
          items={items}
          onChange={s => setSelected(s)}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button buttonStyle="tertiary" onClick={() => setShowModal(false)} className="grow">
          <Translate>Cancel</Translate>
        </Button>
        <Button
          onClick={() => {
            install();
            setShowModal(false);
          }}
          className="grow"
        >
          <Translate>Install</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { InstallLanguagesModal };
