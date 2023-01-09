import React, { useState } from 'react';
import Modal from 'app/Layout/Modal';
import { Translate } from 'app/I18N';
import { MultiSelect } from 'app/Forms';
import { TemplateSchema } from 'shared/types/templateType';
import { ObjectIdSchema } from 'shared/types/commonTypes';
import Icons from 'app/Templates/components/Icons';

const SUPPORTED_PROPERTIES = ['text', 'numeric', 'date'];

export interface IXExtractorInfo {
  name: string;
  property: string;
  templates: ObjectIdSchema[];
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

  const [values, setValues] = useState([]);
  // @ts-ignore
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
    onAccept(result);
  };

  return (
    <Modal isOpen={isOpen} type="content" className="suggestion-acceptance-modal">
      <Modal.Header>
        <h1>
          <Translate>Add property</Translate>
          <span>*</span>
        </h1>
      </Modal.Header>
      <Modal.Body>
        <input
          value={name}
          type="text"
          //className="form-control"
          onChange={event => setName(event.target.value)}
        />
        <MultiSelect
          value={values}
          onChange={setValues}
          options={options}
          optionsToShow={20}
          disableTopLevel
        />
      </Modal.Body>
      <Modal.Footer>
        <span className="left">
          *<Translate>Only text, number and date properties are currently supported</Translate>
        </span>
        <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
          <Translate>Cancel</Translate>
        </button>
        <button
          type="button"
          className="btn confirm-button btn-success"
          onClick={() => handleSubmit(name, values)}
        >
          <Translate>Save</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export interface ExtractorCreationModalStateType {
  configurationModalIsOpen: boolean;
  creationModelIsOpen: boolean;
}
