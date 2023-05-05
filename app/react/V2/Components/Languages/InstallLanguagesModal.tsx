import React, { useState } from 'react';
import { Translate, I18NApi } from 'app/I18N';
import { SetterOrUpdater } from 'recoil';
import { Button, Modal, SearchMultiselect } from 'app/V2/Components/UI';
import { LanguageSchema } from 'shared/types/commonTypes';
import { RequestParams } from 'app/utils/RequestParams';
import { useApiCaller } from 'app/V2/CustomHooks/useApiCaller';

type InstallLanguagesModalProps = {
  setShowModal: SetterOrUpdater<boolean>;
  languages: LanguageSchema[];
};

const InstallLanguagesModal = ({ setShowModal, languages }: InstallLanguagesModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { requestAction } = useApiCaller();

  const items = languages.map(l => ({ label: l.localized_label || l.label, value: l.key }));

  const install = async () => {
    await requestAction(
      I18NApi.addLanguage,
      new RequestParams(languages.filter(l => selected.includes(l.key))),
      'Languages installed successfully'
    );
  };

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Install language</Translate>
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
          onClick={async () => {
            setShowModal(false);
            await install();
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
