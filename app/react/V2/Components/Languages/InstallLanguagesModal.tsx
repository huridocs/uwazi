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

  const items = languages.map(l => ({
    label: `${l.translationAvailable ? ' * ' : ''}${l.label} (${l.key})`,
    value: l.key,
  }));

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
          <Translate>Install language(s)</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body>
        <SearchMultiselect
          className="overflow-y-scroll max-h-96"
          items={items}
          onChange={s => setSelected(s)}
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <p className="w-full pt-0 pb-3 text-sm font-normal text-gray-500 dark:text-gray-400">
            * <Translate>Available default translation</Translate>
          </p>
          <div className="flex gap-2">
            <Button buttonStyle="tertiary" onClick={() => setShowModal(false)} className="grow">
              <Translate>Cancel</Translate>
            </Button>
            <Button
              onClick={async () => {
                setShowModal(false);
                await install();
              }}
              className="grow"
              disabled={!selected.length}
            >
              <Translate>Install</Translate> {selected.length ? `(${selected.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { InstallLanguagesModal };
