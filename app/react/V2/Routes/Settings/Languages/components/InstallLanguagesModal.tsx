import React, { useState, useMemo } from 'react';
import { Translate, I18NApi, t } from '#app/I18N/index.js';
import { Button, Modal } from '#app/V2/Components/UI/index.js';
import {
  defaultSearch,
  MultiselectList,
  MultiselectListOption,
} from '#app/V2/Components/Forms/index.js';
import { LanguageSchema } from '#shared/types/commonTypes.js';
import { RequestParams } from '#app/utils/RequestParams.js';
import { FetchResponseError } from '#shared/JSONRequest.js';
import { registerTask, notify as bridgeNotify } from '#V2/utils/notifyBridge.js';

type InstallLanguagesModalProps = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  languages: LanguageSchema[];
};

const InstallLanguagesModal = ({ setShowModal, languages }: InstallLanguagesModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const items = useMemo(
    () =>
      languages.map(l => ({
        label: `${l.translationAvailable ? ' * ' : ''}${l.label} (${l.key})`,
        value: l.key,
        searchLabel: l.label,
      })),
    [languages]
  );

  const [options, setOptions] = useState<MultiselectListOption[]>(items);

  const install = async () => {
    setShowModal(false);
    const response = await I18NApi.addLanguage(
      new RequestParams(languages.filter(l => selected.includes(l.key)))
    );
    if (response instanceof FetchResponseError) {
      bridgeNotify(t('System', 'An error occurred', null, false), 'error', response.message);
    } else {
      registerTask('language-install', t('System', 'Installing languages', null, false));
    }
  };

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium [color:var(--color-theme-text-primary)]">
          <Translate>Install Language(s)</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body className="pt-0">
        <Translate className="block px-2 pt-4 text-justify [color:var(--color-theme-text-secondary)]">
          This action may take some time while we add the extra language to the entire collection.
        </Translate>
        <div className="h-96 pt-2">
          <MultiselectList
            items={options}
            onChange={s => setSelected(s)}
            onSearch={s => setOptions(() => defaultSearch(s, items))}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <p className="w-full pt-0 pb-3 text-sm font-normal [color:var(--color-theme-text-muted)]">
            * <Translate>Available default translation</Translate>
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setShowModal(false)} className="grow">
              <Translate>Cancel</Translate>
            </Button>
            <Button
              onClick={async () => {
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
