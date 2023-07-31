import React, { useEffect, useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { ClientTemplateSchema } from 'app/istore';
import Icons from 'app/Templates/components/Icons';
import { IXExtractorInfo } from 'V2/shared/types';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

interface ExtractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: ClientTemplateSchema[];
  extractor?: IXExtractorInfo;
}

const ExtractorModal = ({
  isOpen,
  onClose,
  onAccept,
  templates,
  extractor,
}: ExtractorModalProps) => {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);
  const [isEditing, setEditing] = useState<boolean>(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [error, setError] = useState(false);

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
    }
  }, [extractor]);

  const filter = values.length ? values[0].split('-', 2)[1] : null;
  const options = templates.map(template => ({
    label: template.name,
    id: template._id,
    value: template._id,
    options: template.properties
      ?.filter(prop => !filter || prop.name === filter)
      .map(prop => ({
        label: prop.label,
        value: `${template._id?.toString()}-${prop.name}`,
        type: prop.type,
        icon: { type: 'Icons', _id: Icons[prop.type] },
      }))
      .filter(({ type }) => SUPPORTED_PROPERTIES.includes(type))
      .concat(
        !filter || filter === 'title'
          ? [
              {
                label: 'Title',
                value: `${template._id?.toString()}-title`,
                type: 'text',
                icon: { type: 'Icons', _id: Icons.text },
              },
            ]
          : []
      ),
  }));

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
      setError(true);
      return;
    }

    setEditing(false);
    setIsDisabled(true);
    const result: null | IXExtractorInfo = submitedValues.length
      ? {
          _id: undefined,
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: submitedValues.map(value => value.split('-', 2)[0]),
        }
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
    <Modal isOpen={isOpen} type="content" className="extractor-creation-modal">
      <Modal.Header>
        <div className="extractor-label">
          {isEditing ? (
            <Translate>Edit Extractor</Translate>
          ) : (
            <Translate>Create Extractor</Translate>
          )}
        </div>
        <div className="all-templates-button">
          <button
            type="button"
            className="btn"
            onClick={onAllTemplatedCheckboxChanged}
            disabled={!values.length}
          >
            <Translate>From all templates</Translate>
          </button>
        </div>
      </Modal.Header>
      <Modal.Body>
        <input
          value={name}
          type="text"
          className="form-control extractor-name-input"
          onChange={event => {
            setName(event.target.value);
            setError(false);
          }}
          placeholder="Extractor name"
        />
        {error && (
          <div className="tw-content">
            <Translate className="block mt-1 text-sm font-medium text-error-700">
              This field is required
            </Translate>
          </div>
        )}
        <div className="property-selection">
          <MultiSelect
            className="ix-extraction-multiselect"
            value={values}
            onChange={setValues}
            options={options}
            optionsToShow={20}
            topLevelSelectable={false}
          />
        </div>
        <span className="left">
          * <Translate>Only text, number and date properties are currently supported</Translate>
        </span>
      </Modal.Body>
      <Modal.Footer>
        <div className="extractor-footer">
          <button
            type="button"
            className="btn btn-default btn-extra-padding action-button"
            onClick={handleClose}
          >
            <Translate>Cancel</Translate>
          </button>
          <button
            type="button"
            className="btn btn-default action-button btn-extra-padding"
            onClick={() => handleSubmit(name, values)}
            disabled={isDisabled}
          >
            {isEditing ? <Translate>Save</Translate> : <Translate>Add</Translate>}
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export { ExtractorModal };
