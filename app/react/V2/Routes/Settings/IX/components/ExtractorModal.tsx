/* eslint-disable max-lines */
/* eslint-disable max-statements */
import React, { useState, useEffect } from 'react';
import { uniq } from 'lodash';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { ClientIXExtractorType } from 'V2/shared/types';
import { InputField } from 'V2/Components/Forms/InputField';
import { defaultSearch, MultiselectList, RadioSelect } from 'V2/Components/Forms';
import { Modal, Button, Pill } from 'V2/Components/UI';
import { propertyIcons } from '../../../../Components/UI/Icons';
import {
  getAvailableSources,
  getPropertyNameFromExtractPair,
  getTemplateFromExtractPair,
} from '../helpers';

const SUPPORTED_PROPERTIES = [
  'text',
  'numeric',
  'date',
  'select',
  'multiselect',
  'relationship',
  'markdown',
];

type SupportedProperty = Omit<ClientPropertySchema, 'type'> & {
  type: 'text' | 'numeric' | 'date' | 'select' | 'multiselect' | 'relationship';
};

interface ExtractorModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onAccept: (extractorInfo: ClientIXExtractorType) => void;
  templates: ClientTemplateSchema[];
  extractor?: ClientIXExtractorType;
}

const getPropertyLabel = (property: SupportedProperty, templateId: string) => {
  const { type } = property;

  const icon = propertyIcons[type];
  const propertyTypeTranslationKey = `property ${type}`;

  return (
    <div className="flex items-center gap-2">
      <span className="w-4">{icon}</span>
      <Translate context={templateId}>{property.label}</Translate>
      <Translate
        translationKey={propertyTypeTranslationKey}
        className="lowercase before:content-['('] after:content-[')']"
      >
        {property.type}
      </Translate>
    </div>
  );
};

const formatOptions = (values: string[], templates: ClientTemplateSchema[]) => {
  const propertyName = values.length ? getPropertyNameFromExtractPair(values[0]) : null;
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
            label: getPropertyLabel(prop as SupportedProperty, template._id),
            value: `${template._id?.toString()}-${prop.name}`,
            searchLabel: prop.label,
          })),
      };

      if (propertyName === 'title' || !propertyName) {
        option.items.push({
          label: getPropertyLabel({ label: 'Title', name: 'Title', type: 'text' }, template._id),
          value: `${template._id?.toString()}-title`,
          searchLabel: 'Title',
        });
      }

      return option;
    })
    .filter(template => template.items.length);
};

const getPropertyForValue = (value: string, templates: ClientTemplateSchema[]) => {
  const [templateId, propertyName] = (value || '').split('-');

  const matchedTemplate = templates.find(template => template._id.toString() === templateId);

  if (propertyName === 'title') {
    return getPropertyLabel(
      {
        name: 'title',
        label: 'Title',
        type: 'text',
      },
      matchedTemplate!._id.toString()
    );
  }

  const matchedProperty = matchedTemplate?.properties.find(
    property => property.name === propertyName
  ) as SupportedProperty;

  if (matchedProperty) {
    return getPropertyLabel(matchedProperty, matchedTemplate!._id.toString());
  }

  return <div />;
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
  const [source, setSource] = useState<string>('0');
  const [options, setOptions] = useState<any[]>([]);
  const [hasNameError, setNameError] = useState(false);

  const handleClose = () => {
    setName('');
    setValues([]);
    onClose();
  };

  useEffect(() => {
    setOptions(formatOptions(values, templates));
  }, [values, templates]);

  const handleSubmit = () => {
    if (!name.length) {
      setNameError(true);
      return;
    }

    const extractorSource = source === '0' ? { pdf: true } : { property: source };

    const result: null | ClientIXExtractorType = values.length
      ? ({
          name,
          source: extractorSource,
          property: getPropertyNameFromExtractPair(values[0]),
          templates: uniq(values.map(value => getTemplateFromExtractPair(value))),
        } as ClientIXExtractorType)
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

  const onSearch = (search: string) => {
    const newItems = defaultSearch(search, formatOptions(values, templates));
    setOptions(newItems);
  };

  return (
    <Modal size="xxl">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          {extractor ? <Translate>Edit Extractor</Translate> : <Translate>Add Extractor</Translate>}
        </h1>
        <Modal.CloseButton onClick={() => setShowModal(false)} />
      </Modal.Header>

      <Modal.Body className="pt-0">
        <InputField
          className="mt-6"
          id="extractor-name"
          placeholder="Extractor name"
          hasErrors={hasNameError}
          value={name}
          onChange={event => {
            setName(event.target.value);
            setNameError(false);
          }}
        />

        <div className={`${step !== 1 ? 'hidden' : ''} pt-2 h-96`}>
          <MultiselectList
            selectedValues={values || []}
            items={options}
            onChange={setValues}
            onSearch={onSearch}
            checkboxes
            foldableGroups
            allowSelelectAll={values.length > 0}
            startOnSelected={values.length > 0}
          />
        </div>
        <div className={`${step !== 2 && 'hidden'} mt-6`}>
          <div>
            <h6 className="text-sm font-medium">
              <Translate>Input</Translate>
            </h6>
            <div className="p-3">{getPropertyForValue(values[0], templates)}</div>
            <h6 className="text-sm font-medium">
              <Translate>Selected templates</Translate>
            </h6>
            <div className="flex flex-wrap p-3">
              {values.map(value => {
                const templateId = getTemplateFromExtractPair(value);
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
                options={getAvailableSources(templates, values, extractor)}
                onChange={selected => {
                  setSource(selected.currentTarget.value);
                }}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-center w-full gap-2">
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
                <Button className="grow" onClick={() => setStep(2)} disabled={values.length === 0}>
                  <span className="flex items-center justify-center gap-2 flex-nowrap">
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
                <Button className="grow" onClick={() => handleSubmit()} color="success">
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
