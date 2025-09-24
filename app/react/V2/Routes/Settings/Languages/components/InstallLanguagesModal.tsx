import React, { useState, useMemo } from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate, I18NApi } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, Modal } from '../../V2/Components/UI.js';
import {
  defaultSearch,
  MultiselectList,
  MultiselectListOption,
  // @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
} from '../../V2/Components/Forms.js';

import { LanguageSchema } from 'shared/types/commonTypes.js';
// @ts-expect-error TS(2307): Cannot find module '../../utils/RequestParams.js' ... Remove this comment to see the full error message
import { RequestParams } from '../../utils/RequestParams.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/CustomHooks/useApiCal... Remove this comment to see the full error message
import { useApiCaller } from '../../V2/CustomHooks/useApiCaller.js';

type InstallLanguagesModalProps = {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  languages: LanguageSchema[];
};

const InstallLanguagesModal = ({ setShowModal, languages }: InstallLanguagesModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);
  const { requestAction } = useApiCaller();

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
    await requestAction(
      I18NApi.addLanguage,
      new RequestParams(languages.filter(l => selected.includes(l.key))),
      <Translate translationKey="Language Install Start Message">
        Language installation process initiated. It may take several minutes to complete depending
        on the size of the collection. Please wait until the installation process is finished.
      </Translate>
    );
  };

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Install Language(s)</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body className="pt-0">
        <Translate className="block px-2 pt-4 text-justify text-gray-700">
          This action may take some time while we add the extra language to the entire collection.
        </Translate>
        <div className="h-96 pt-2">
          <MultiselectList
            items={options}
            // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
            onChange={s => setSelected(s)}
            // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
            onSearch={s => setOptions(() => defaultSearch(s, items))}
          />
        </div>
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <p className="w-full pt-0 pb-3 text-sm font-normal text-gray-500 dark:text-gray-400">
            * <Translate>Available default translation</Translate>
          </p>
          <div className="flex gap-2">
            <Button styling="light" onClick={() => setShowModal(false)} className="grow">
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
