import Modal from 'app/Layout/Modal';
import React, { useState } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { UserGroupsLookupField } from './UserGroupsLookupField';

const data: any = [
  {
    type: 'user',
    id: 'id1',
    label: 'User name',
  },
  {
    type: 'group',
    id: 'id1',
    label: 'Group name',
  },
  {
    type: 'group',
    id: 'id2',
    label: 'Group name 2',
  },
];

export interface ShareEntityModalProps {
  isOpen: boolean;
  onClose: (event: any) => void;
  onSave: (event: any) => void;
}

export const ShareEntityModalComponent = ({ isOpen, onClose, onSave }: ShareEntityModalProps) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  const onChangeHandler = (value: string) => {
    setSearch(value);
    setResults(value ? data.filter((elem: any) => elem.label.includes(value)) : []);
  };

  return (
    <Modal isOpen={isOpen} type="content" className="share-modal">
      <Modal.Header>
        <div className="round-icon">
          <Icon icon="user-plus" />
        </div>
        <h1>
          <Translate>Share with people and groups</Translate>
        </h1>
      </Modal.Header>

      <Modal.Body>
        <UserGroupsLookupField
          value={search}
          onChange={onChangeHandler}
          onSelect={console.log}
          options={results}
        />
      </Modal.Body>

      <Modal.Footer>
        <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
          <Icon icon="times" />
          <Translate>Discard changes</Translate>
        </button>
        <button type="button" className="btn confirm-button btn-success" onClick={onSave}>
          <Icon icon="save" />
          <Translate>Save changes</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export const ShareEntityModal = ShareEntityModalComponent;
