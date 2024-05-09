/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useState } from 'react';
import { uniq } from 'lodash';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
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

const getPropertyLabel = (property: ClientPropertySchema) => {
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
  const propertyName = values.length ? values[0].split('-', 2)[1] : null;

  return templates
    .map(template => {
      const option = {
        label: template.name,
        id: template._id,
        searchLabel: template.name,
        value: template._id,
        items: template.properties
          ?.filter(
            prop =>
              (!propertyName || prop.name === propertyName) &&
              SUPPORTED_PROPERTIES.includes(prop.type)
          )
          .map(prop => ({
            label: getPropertyLabel(prop),
            value: `${template._id?.toString()}-${prop.name}`,
            searchLabel: prop.label,
          })),
      };

      if (propertyName === 'title' || !propertyName) {
        option.items.push({
          label: getPropertyLabel({ label: 'Title', name: 'Title', type: 'text' }),
          value: `${template._id?.toString()}-title`,
          searchLabel: 'Title',
        });
      }

      return option;
    })
    .filter(template => template.items.length);
};

const ExtractorModal = ({
  setShowModal,
  onClose,
  onAccept,
  templates,
  extractor,
}: ExtractorModalProps) => {
  const initialValues =
    extractor?.templates.map(template => `${template}-${extractor.property}`) || [];

  const [step, setStep] = useState(1);
  const [name, setName] = useState(extractor?.name || '');
  const [values, setValues] = useState<string[]>(initialValues);
  const [options, setOptions] = useState(formatOptions(initialValues, templates));
  const [hasNameError, setNameError] = useState(false);

  const handleClose = () => {
    setName('');
    setValues([]);
    onClose();
  };

  const handleSubmit = (submittedName: string, submitedValues: string[]) => {
    if (!submittedName.length) {
      setNameError(true);
      return;
    }

    const result: null | IXExtractorInfo = submitedValues.length
      ? ({
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: uniq(submitedValues.map(value => value.split('-', 2)[0])),
        } as IXExtractorInfo)
      : null;

    if (result && extractor) {
      result._id = extractor._id;
    }

    if (result === null) {
      handleClose();
    } else {
      onAccept(result);
      handleClose();
    }
  };

  const handleSelectAll = () => {
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
    <Modal size="xxl">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          {extractor ? <Translate>Edit Extractor</Translate> : <Translate>Add Extractor</Translate>}
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>

      <Modal.Body className="flex flex-col gap-4 px-3 pt-4">
        <InputField
          clearFieldAction={() => {}}
          id="extractor-name"
          placeholder="Extractor name"
          hasErrors={hasNameError}
          value={name}
          onChange={event => {
            setName(event.target.value);
            setNameError(false);
          }}
        />

        {step === 1 ? (
          <MultiselectList
            className="h-80"
            value={initialValues || []}
            items={options}
            onChange={selected => {
              setValues(selected);
              setOptions(formatOptions(selected, templates));
            }}
            checkboxes
            foldableGroups
          />
        ) : (
          <div className="h-80">
            <h6 className="text-sm font-medium">
              <Translate>Input</Translate>
            </h6>
            <div className="p-3">
              {getPropertyLabel({
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
                  <Pill color="gray" className="m-1" key={templateId}>
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

        <div className="self-end">
          <Button
            type="button"
            onClick={() => handleSelectAll()}
            styling="outline"
            disabled={values.length === 0}
          >
            <Translate>Sellect all</Translate>
          </Button>
        </div>

        <div className="flex gap-2 justify-center w-full">
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
                  <span className="flex flex-nowrap gap-2 justify-center items-center">
                    <Translate>Next</Translate>
                    <ArrowRightIcon className="w-5" />
                  </span>
                </Button>
              </>
            ) : (
              <>
                <Button styling="light" onClick={() => setStep(1)} className="grow">
                  <Translate>Back</Translate>
                </Button>
                <Button className="grow" onClick={() => handleSubmit(name, values)} color="success">
                  {extractor ? <Translate>Update</Translate> : <Translate>Create</Translate>}
                </Button>
              </>
            )}
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { ExtractorModal, formatOptions };
