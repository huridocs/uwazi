import React, { useState } from 'react';
// @ts-expect-error TS(2307): Cannot find module '../../I18N/index.js' or its co... Remove this comment to see the full error message
import { Translate } from '../../I18N/index.js';
// @ts-expect-error TS(2307): Cannot find module '../../V2/Components/UI.js' or ... Remove this comment to see the full error message
import { Button, Modal } from '../../V2/Components/UI.js';
import {
  defaultSearch,
  MultiselectList,
  MultiselectListOption,
  // @ts-expect-error TS(2307): Cannot find module '../../V2/Components/Forms.js' ... Remove this comment to see the full error message
} from '../../V2/Components/Forms.js';
// @ts-expect-error TS(2307): Cannot find module '../../istore.js' or its corres... Remove this comment to see the full error message
import { ClientTemplateSchema } from '../../istore.js';

type AddTemplateModalProps = {
  onCancel: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (templateIds: string[]) => void;
  templates?: ClientTemplateSchema[];
};

const AddTemplatesModal = ({ onCancel, onAdd, templates }: AddTemplateModalProps) => {
  const items = templates?.map(template => ({
    label: template.name,
    value: template._id,
    searchLabel: template.name,
  }));

  const [selected, setSelected] = useState<string[]>([]);
  const [options, setOptions] = useState<MultiselectListOption[]>(items || []);

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Add entity type</Translate>
        </h1>
        <Modal.CloseButton onClick={() => onCancel(false)} />
      </Modal.Header>
      <Modal.Body className="pt-4 h-96">
        <MultiselectList
          items={options || []}
          // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
          onChange={s => setSelected(s)}
          // @ts-expect-error TS(7006): Parameter 's' implicitly has an 'any' type.
          onSearch={s => {
            setOptions(() => defaultSearch(s, items));
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <div className="flex gap-2">
            <Button styling="light" onClick={() => onCancel(false)} className="grow">
              <Translate>Cancel</Translate>
            </Button>
            <Button
              onClick={async () => {
                onCancel(false);
                onAdd(selected);
              }}
              className="grow"
              disabled={!selected.length}
            >
              <Translate>Add</Translate> {selected.length ? `(${selected.length})` : ''}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { AddTemplatesModal };
