import React, { useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { TemplateSchema } from 'shared/types/templateType';
import Icons from 'app/Templates/components/Icons';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

export interface IXExtractorInfo {
  _id?: string;
  name: string;
  property: string;
  templates: string[];
}

export interface ExtractorCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (extractorInfo: IXExtractorInfo) => void;
  templates: TemplateSchema[];
}

export const ExtractorCreationModal = ({
  isOpen,
  onClose,
  onAccept,
  templates,
}: ExtractorCreationModalProps) => {
  const [name, setName] = useState('');
  const [values, setValues] = useState<string[]>([]);

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
      .filter(p => SUPPORTED_PROPERTIES.includes(p.type))
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

  const handleSubmit = (submittedName: string, submitedValues: string[]) => {
    const result: null | IXExtractorInfo = submitedValues.length
      ? {
          name: submittedName,
          property: submitedValues[0].split('-', 2)[1],
          templates: submitedValues.map(value => value.split('-', 2)[0]),
        }
      : null;
    if (result === null) {
      onClose();
    } else {
      onAccept(result);
    }
  };

  const handleClose = () => {
    setName('');
    setValues([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} type="content" className="extractor-creation-modal">
      <Modal.Header>
        <div className="extractor-label">
          <Translate>Add property</Translate>
        </div>
        <div className="all-templates-checkbox">
          <input type="checkbox" />
          <span>From all templates</span>
        </div>
      </Modal.Header>
      <Modal.Body>
        <input
          value={name}
          type="text"
          className="form-control extractor-name-input"
          onChange={event => setName(event.target.value)}
          placeholder="Extractor name"
        />
        <div className="property-selection">
          <MultiSelect
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
          >
            <Translate>Add</Translate>
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export interface ExtractorCreationModalStateType {
  configurationModalIsOpen: boolean;
  creationModelIsOpen: boolean;
}
