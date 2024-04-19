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
  const [extractorName, setExtractorName] = useState('');
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [hasNameError, setNameError] = useState(false);
  const [displayableItems, setDisplayableItems] = useState<MultiselectListOption[]>([]);

  useEffect(() => {
    if (extractor) {
      setEditing(true);
      setExtractorName(extractor.name);
      const initialValues = extractor.templates.map(
        template => `${template}-${extractor.property}`
      );
      setSelectedValues(initialValues);
    } else {
      setEditing(false);
      setExtractorName('');
      setSelectedValues([]);
    }
  }, [extractor]);

  useEffect(() => {
    const temps = templates.map<MultiselectListOption>(template => {
      const commonProperties = template.commonProperties ? template.commonProperties : [];
      const items = [...commonProperties, ...template.properties]
        .filter(({ type }) => SUPPORTED_PROPERTIES.includes(type))
        .map(prop => ({
          label: prop.label,
          value: `${template._id?.toString()}-${prop.name}`,
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

  // const filter = selectedValues.length ? selectedValues[0].split('-', 2)[1] : null;
  // const options = templates.map(template => ({
  //   label: template.name,
  //   id: template._id,
  //   value: template._id,
  //   options: template.properties
  //     ?.filter(prop => !filter || prop.name === filter)
  //     .map(prop => ({
  //       label: prop.label,
  //       value: `${template._id?.toString()}-${prop.name}`,
  //       type: prop.type,
  //       icon: { type: 'Icons', _id: Icons[prop.type] },
  //     }))
  //     .filter(({ type }) => SUPPORTED_PROPERTIES.includes(type))
  //     .concat(
  //       !filter || filter === 'title'
  //         ? [
  //             {
  //               label: 'Title',
  //               value: `${template._id?.toString()}-title`,
  //               type: 'text',
  //               icon: { type: 'Icons', _id: Icons.text },
  //             },
  //           ]
  //         : []
  //     ),
  // }));

  const handleClose = () => {
    setEditing(false);
    setExtractorName('');
    setSelectedValues([]);
    setIsDisabled(false);
    onClose();
  };

  // eslint-disable-next-line max-statements
  const handleSubmit = (submittedName: string, submitedValues: string[]) => {
    if (!submittedName.length) {
      setNameError(true);
      return;
    }

    setEditing(false);
    setIsDisabled(true);
    const result: null | IXExtractorInfo = submitedValues.length
      ? ({
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: submitedValues.map(value => value.split('-', 2)[0]),
        } as IXExtractorInfo)
      : null;

    if (isEditing && result && extractor) {
      result._id = extractor._id;
    }

    if (result === null) {
      handleClose();
    } else {
      onAccept(result);
      handleClose();
    }
  };

  const onAllTemplatedCheckboxChanged = () => {
    const properties = new Set();
    const newValues: string[] = [];

    selectedValues.forEach(value => {
      properties.add(value.split('-')[1]);
    });

    const validTemplateIds: string[] = templates
      .filter(template => {
        const isTitle = properties.has('title');

        if (isTitle) return true;

        const hasMatchingProperty = template.properties.filter(property =>
          properties.has(property.name)
        ).length;

        return hasMatchingProperty > 0;
      })
      .map(template => template._id);

    validTemplateIds.forEach(id => {
      const arrProps = Array.from(properties);
      arrProps.forEach(prop => {
        newValues.push(`${id}-${prop}`);
      });
    });

    setSelectedValues(newValues);
  };

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
          hasErrors={hasNameError}
          value={extractorName}
          onChange={event => {
            setExtractorName(event.target.value);
            setNameError(false);
          }}
        />
        <MultiselectList
          className="pt-4 max-h-96"
          items={displayableItems}
          onChange={(s: any) => {
            console.log(s);
            setSelectedValues(s);
          }}
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
            <Button className="grow" onClick={handleSubmit}>
              <Translate>Next</Translate>
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { ExtractorModal };
