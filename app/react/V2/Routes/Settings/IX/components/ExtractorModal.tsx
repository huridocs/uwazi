import React, { useEffect, useState } from 'react';
import { Modal, Button, MultiselectList } from 'V2/Components/UI';
import Icons from 'app/Templates/components/Icons';
import { Translate } from 'app/I18N';
import { ClientPropertySchema, ClientTemplateSchema } from 'app/istore';
import { IXExtractorInfo } from 'V2/shared/types';
import { InputField } from 'app/V2/Components/Forms/InputField';
import { CalculatorIcon, CalendarIcon } from '@heroicons/react/20/solid';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

interface ExtractorModalProps {
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: ClientTemplateSchema[];
  extractor?: IXExtractorInfo;
}

const renderPropertyLabel = (property: ClientPropertySchema) => {
  let icon = <></>;
  switch (property.type) {
    case 'numeric':
      icon = <CalculatorIcon className="w-5" />;
      break;
    case 'date':
      icon = <CalendarIcon className="w-5" />;
      break;
    case 'text':
      icon = <CalendarIcon className="w-5" />;
      break;
  }

  return (
    <div className="flex gap-2">
      <span>{icon}</span>
      <span>
        {property.label} {'(' + property.type + ')'}
      </span>
    </div>
  );
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
  const [_isDisabled, setIsDisabled] = useState(false);
  const [hasNameError, setNameError] = useState(false);
  const [options, setOptions] = useState<any[]>([]);

  useEffect(() => {
    if (extractor) {
      setEditing(true);
      setName(extractor.name);
      const initialValues = extractor.templates.map(
        template => `${template}-${extractor.property}`
      );
      setValues(initialValues);
    } else {
      setEditing(false);
      setName('');
      setValues([]);
    }
  }, [extractor]);

  useEffect(() => {
    const filter = values.length ? values[0].split('-', 2)[1] : null;
    const options = templates.map(template => ({
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
    }));

    setOptions(options);
  }, [values, step]);

  const handleClose = () => {
    setEditing(false);
    setName('');
    setValues([]);
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

  const renderSteps = () => {
    switch (step) {
      case 1:
        return (
          <MultiselectList
            className="pt-4 max-h-96"
            value={values}
            items={options}
            onChange={(s: any) => {
              setValues(s);
            }}
            checkboxes
            foldableGroups
          />
        );
      case 2:
        return (
          <div>
            <div>{values[0]?.split('-', 2)[1]}</div>
            <div>
              {values.map(value => {
                const templateId = value?.split('-', 2)[0];
                const template = templates.find(temp => temp._id === templateId);
                return <div>{template?.name}</div>;
              })}
            </div>
          </div>
        );
      default:
        return;
    }
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
          value={name}
          onChange={event => {
            setName(event.target.value);
            setNameError(false);
          }}
        />
        {renderSteps()}
      </Modal.Body>
      <Modal.Footer>
        <div className="flex flex-col w-full">
          <p className="w-full pt-0 pb-3 text-sm font-normal text-gray-500 dark:text-gray-400">
            * <Translate>We're adding more properties support, soon!</Translate>
          </p>
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
