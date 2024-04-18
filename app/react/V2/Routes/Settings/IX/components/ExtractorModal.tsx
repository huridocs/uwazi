import React, { useEffect, useState } from 'react';
import { Modal, Button, MultiselectList, MultiselectListOption } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientTemplateSchema } from 'app/istore';
import { IXExtractorInfo } from 'V2/shared/types';
import { InputField } from 'app/V2/Components/Forms/InputField';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

interface ExtractorModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: ClientTemplateSchema[];
  extractor?: IXExtractorInfo;
}

const ExtractorModal = ({
  setShowModal,
  onClose,
  onAccept,
  templates,
  extractor,
}: ExtractorModalProps) => {
  const [selected, setSelected] = useState([]);
  const [displayableItems, setDisplayableItems] = useState<MultiselectListOption[]>([]);

  useEffect(() => {
    const temps = templates.map<MultiselectListOption>(template => {
      const commonProperties = template.commonProperties ? template.commonProperties : [];
      const items = [...commonProperties, ...template.properties]
        .filter(prop => SUPPORTED_PROPERTIES.includes(prop.type))
        .map(prop => ({
          label: prop.label,
          value: prop._id as string,
          searchLabel: prop.label,
        }));

      return {
        label: template.name,
        value: template._id as string,
        searchLabel: template.name,
        items,
      };
    });
    setDisplayableItems(temps);
  }, []);
  return (
    <Modal size="xl">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Add extractor</Translate>
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>
      <Modal.Body className="pt-4">
        <InputField
          clearFieldAction={() => {}}
          id="extractor-name"
          placeholder="Extractor name"
          className="mb-2"
        />
        <MultiselectList
          className="pt-4 max-h-96"
          items={displayableItems}
          onChange={(s: any) => setSelected(s)}
          checkboxes
          foldableGroups
        />
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <p className="w-full pt-0 pb-3 text-sm font-normal text-gray-500 dark:text-gray-400">
            * <Translate>We're adding more properties support, soon!</Translate>
          </p>
          <div className="flex gap-2">
            <Button styling="light" onClick={() => setShowModal(false)} className="grow">
              <Translate>Cancel</Translate>
            </Button>
            <Button className="grow">
              <Translate>Next</Translate>
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { ExtractorModal };
