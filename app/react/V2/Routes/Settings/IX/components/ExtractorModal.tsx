/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useEffect, useMemo, useState } from 'react';
import { uniq } from 'lodash';
import { Modal, Button, MultiselectList, Pill } from 'V2/Components/UI';
import { Translate } from 'app/I18N';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { IXExtractorInfo } from 'V2/shared/types';
import { InputField } from 'app/V2/Components/Forms/InputField';
import { RadioSelect } from 'app/V2/Components/Forms';
import { propertyIcons } from './Icons';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date', 'select', 'multiselect'];

interface ExtractorModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: ClientTemplateSchema[];
  extractor?: IXExtractorInfo;
}

const renderPropertyLabel = (property: ClientPropertySchema) => {
  let icon: React.ReactNode;

  switch (property.type) {
    case 'numeric':
      icon = propertyIcons.numeric;
      break;
    case 'date':
      icon = propertyIcons.date;
      break;
    case 'select':
      icon = propertyIcons.select;
      break;
    case 'multiselect':
      icon = propertyIcons.multiselect;
      break;
    default:
      icon = propertyIcons.text;
  }

  return (
    <div className="flex gap-2 items-center">
      <span className="w-4">{icon}</span>
      <span>
        {property.label} {`( ${property.type} )`}
      </span>
    </div>
  );
};

const formatOptions = (values: string[], templates: ClientTemplateSchema[]) => {
  const filter = values.length ? values[0].split('-', 2)[1] : null;

  return templates
    .map(template => ({
      label: template.name,
      id: template._id,
      searchLabel: template.name,
      value: template._id,
      items: template.properties
        ?.filter(prop => !filter || prop.name === filter)
        .filter(({ type }) => SUPPORTED_PROPERTIES.includes(type))
        .map(prop => ({
          label: renderPropertyLabel(prop),
          value: `${template._id?.toString()}-${prop.name}`,
          searchLabel: prop.label,
        }))
        .concat(
          !filter || filter === 'title'
            ? [
                {
                  label: renderPropertyLabel({ label: 'Title', name: 'Title', type: 'text' }),
                  value: `${template._id?.toString()}-title`,
                  searchLabel: 'Title',
                },
              ]
            : []
        ),
    }))
    .filter(template => template.items.length);
};

const ExtractorModal = ({
  setShowModal,
  onClose,
  onAccept,
  templates,
  extractor,
}: ExtractorModalProps) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [hasNameError, setNameError] = useState(false);

  const initialValues = extractor?.templates.map(template => `${template}-${extractor.property}`);

  const options = useMemo(() => formatOptions(values, templates), [values, templates]);

  useEffect(() => {
    if (extractor) {
      setEditing(true);
      setName(extractor.name);
      setValues(initialValues || []);
    } else {
      setEditing(false);
      setName('');
      setValues([]);
    }
  }, [extractor, initialValues]);

  const handleClose = () => {
    setEditing(false);
    setName('');
    setValues([]);
    onClose();
  };

  const handleSubmit = (submittedName: string, submitedValues: string[]) => {
    if (!submittedName.length) {
      setNameError(true);
      return;
    }

    setEditing(false);
    const result: null | IXExtractorInfo = submitedValues.length
      ? ({
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: uniq(submitedValues.map(value => value.split('-', 2)[0])),
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

    values.forEach(value => {
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

    setValues(newValues);
  };

  return (
    <Modal size="xl">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          {extractor ? <Translate>Edit extractor</Translate> : <Translate>Add extractor</Translate>}
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>

      <Modal.Body className="px-3 pt-4">
        <InputField
          clearFieldAction={() => {}}
          id="extractor-name"
          placeholder="Extractor name"
          className="px-2 mb-2"
          hasErrors={hasNameError}
          value={name}
          onChange={event => {
            setName(event.target.value);
            setNameError(false);
          }}
        />

        {step === 1 ? (
          <MultiselectList
            className="pt-4 max-h-96"
            value={initialValues || []}
            items={options}
            onChange={selected => {
              setValues(selected);
            }}
            checkboxes
            foldableGroups
          />
        ) : (
          <div className="px-2 py-4">
            <h6 className="text-sm font-medium">
              <Translate>Input</Translate>
            </h6>
            <div className="p-3">
              {renderPropertyLabel({
                name: values[0]?.split('-', 2)[1],
                label: values[0]?.split('-', 2)[1],
                type: 'text',
              })}
            </div>
            <h6 className="text-sm font-medium">
              <Translate>Selected templates</Translate>
            </h6>
            <div className="flex flex-wrap p-3">
              {values.map(value => {
                const templateId = value?.split('-', 2)[0];
                const template = templates.find(temp => temp._id === templateId);
                return (
                  <Pill color="gray" className="m-1">
                    {template?.name}
                  </Pill>
                );
              })}
            </div>
            <h6 className="text-sm font-medium">
              <Translate>Common sources</Translate>
            </h6>
            <div className="flex flex-wrap p-3">
              <RadioSelect
                name="pdf"
                options={[
                  {
                    label: <Translate>PDF</Translate>,
                    value: 'true',
                    defaultChecked: true,
                  },
                ]}
              />
            </div>
          </div>
        )}

        <div className="my-4">
          <Button
            type="button"
            onClick={() => onAllTemplatedCheckboxChanged()}
            styling="outline"
            disabled={values.length === 0}
          >
            <Translate>Sellect all</Translate>
          </Button>
        </div>

        <div className="flex gap-2 justify-center my-4 w-full">
          <div className={`w-2 h-2 rounded-full ${step === 1 ? 'bg-indigo-700' : 'bg-gray-200'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 2 ? 'bg-indigo-700' : 'bg-gray-200'}`} />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <div className="flex flex-col w-full">
          <div className="flex gap-2">
            {step === 1 ? (
              <>
                <Button styling="light" onClick={() => setShowModal(false)} className="grow">
                  <Translate>Cancel</Translate>
                </Button>
                <Button className="grow" onClick={() => setStep(2)}>
                  <Translate>Next</Translate>
                </Button>
              </>
            ) : (
              <>
                <Button styling="light" onClick={() => setStep(1)} className="grow">
                  <Translate>Back</Translate>
                </Button>
                <Button className="grow" onClick={() => handleSubmit(name, values)}>
                  <Translate>Create</Translate>
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { ExtractorModal };
