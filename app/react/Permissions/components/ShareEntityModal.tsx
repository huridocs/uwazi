import Modal from 'app/Layout/Modal';
import React, { useState, useEffect } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { UserGroupsLookupField } from './UserGroupsLookupField';
import { MemebersList, MemberWithPermission } from './MembersList';
import { FieldOption } from './MemberListItem';

const data: any = [
  {
    type: 'user',
    id: 'id1',
    label: 'User name',
    role: 'admin',
  },
  {
    type: 'group',
    id: 'id1',
    label: 'Group name',
    level: 'read',
  },
  {
    type: 'group',
    id: 'id2',
    label: 'Group name 2',
    level: 'write',
  },
  {
    type: 'user',
    id: 'id1',
    label: 'User name',
    role: 'editor',
  },
  {
    type: 'user',
    id: 'id1',
    label: 'User name',
    role: 'user',
    level: 'read',
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
  const [assignments, setAssignments] = useState<Partial<MemberWithPermission>[]>([]);

  useEffect(() => {
    setAssignments([]);
  }, []);

  const onChangeHandler = (value: string) => {
    setSearch(value);
    setResults(value ? data.filter((elem: any) => elem.label.includes(value)) : []);
  };

  const onSelectHandler = (value: FieldOption) => {
    setAssignments([...assignments, { ...value }]);
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
          onSelect={onSelectHandler}
          options={results}
        />
        <MemebersList members={assignments} />
      </Modal.Body>

      {/*<Modal.Footer>
        <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
          <Icon icon="times" />
          <Translate>Discard changes</Translate>
        </button>
        <button type="button" className="btn confirm-button btn-success" onClick={onSave}>
          <Icon icon="save" />
          <Translate>Save changes</Translate>
        </button>
      </Modal.Footer>*/}
      <Modal.Footer>
        <button type="button" className="btn btn-default pristine" onClick={onClose}>
          <Translate>Close</Translate>
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export const ShareEntityModal = ShareEntityModalComponent;
