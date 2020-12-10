import Modal from 'app/Layout/Modal';
import React, { useState, useEffect } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { UserGroupsLookupField } from './UserGroupsLookupField';
import { MemebersList } from './MembersList';
import { MemberWithPermission } from '../EntityPermisions';
import { searchMembers } from '../PermissionsAPI';

export interface ShareEntityModalProps {
  isOpen: boolean;
  onClose: (event: any) => void;
  onSave: (event: any) => void;
}

const validate = (assignments: MemberWithPermission[]) =>
  assignments
    .map(item => {
      if (item.type === 'group' || item.role === 'contributor') {
        return item.level !== 'mixed'
          ? null
          : {
              id: item.id,
              type: item.type,
            };
      }

      return null;
    })
    .filter(i => i);

export const ShareEntityModalComponent = ({ isOpen, onClose, onSave }: ShareEntityModalProps) => {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<MemberWithPermission[]>([]);
  const [assignments, setAssignments] = useState<MemberWithPermission[]>([]);
  const [dirty, setDirty] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);

  useEffect(() => {
    setAssignments([]);

    return () => {
      setAssignments([]);
      setSearch('');
      setResults([]);
      setDirty(false);
    };
  }, []);

  const onChangeHandler = async (value: string) => {
    setSearch(value);
    setResults(await searchMembers(value));
  };

  const onSelectHandler = (value: MemberWithPermission) => {
    setAssignments([...assignments, { ...value, level: value.level || 'read' }]);
    setDirty(true);
  };

  const onSaveHandler = () => {
    const errors = validate(assignments);

    if (errors) {
      return setValidationErrors(errors);
    }

    return onSave(assignments);
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
        <div className="member-list-wrapper">
          <MemebersList
            members={assignments}
            onChange={value => {
              setAssignments(value);
              setDirty(true);
            }}
            validationErrors={validationErrors}
          />
        </div>
        {validationErrors.length ? (
          <span className="validation-message">Please select access level for marked users.</span>
        ) : null}
      </Modal.Body>

      {dirty ? (
        <Modal.Footer>
          <button type="button" className="btn btn-default cancel-button" onClick={onClose}>
            <Icon icon="times" />
            <Translate>Discard changes</Translate>
          </button>
          <button type="button" className="btn confirm-button btn-success" onClick={onSaveHandler}>
            <Icon icon="save" />
            <Translate>Save changes</Translate>
          </button>
        </Modal.Footer>
      ) : (
        <Modal.Footer>
          <button type="button" className="btn btn-default pristine" onClick={onClose}>
            <Translate>Close</Translate>
          </button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export const ShareEntityModal = ShareEntityModalComponent;
