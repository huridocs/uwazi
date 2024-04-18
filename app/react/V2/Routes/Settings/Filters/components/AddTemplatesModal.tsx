import React, { useState } from 'react';
import { Translate } from 'app/I18N';
import { Button, Modal } from 'app/V2/Components/UI';
import { MultiselectList } from 'app/V2/Components/Forms';
import { ClientTemplateSchema } from 'app/istore';

type AddTemplateModalProps = {
  onCancel: React.Dispatch<React.SetStateAction<boolean>>;
  onAdd: (templateIds: string[]) => void;
  templates?: ClientTemplateSchema[];
};

const AddTemplatesModal = ({ onCancel, onAdd, templates }: AddTemplateModalProps) => {
  const [selected, setSelected] = useState<string[]>([]);

  const items = templates?.map(template => ({
    label: template.name,
    value: template._id,
    searchLabel: template.name,
  }));

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Install Language(s)</Translate>
        </h1>
        <Modal.CloseButton onClick={() => onCancel(false)} />
      </Modal.Header>
      <Modal.Body className="pt-4">
        <MultiselectList
          className="pt-4 max-h-96"
          items={items || []}
          onChange={s => setSelected(s)}
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
