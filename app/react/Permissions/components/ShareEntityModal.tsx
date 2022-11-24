/* eslint-disable react/no-multi-comp */
/* eslint-disable max-statements */
import Modal from 'app/Layout/Modal';
import React, { useState, useEffect } from 'react';
import { Icon } from 'UI';
import { Translate } from 'app/I18N';
import { MemberWithPermission } from 'shared/types/entityPermisions';
import { AccessLevels, MixedAccessLevels, PermissionType } from 'shared/types/permissionSchema';
import { saveEntitiesPermissions } from 'app/Permissions/actions/actions';
import { connect } from 'react-redux';
import { PermissionsDataSchema } from 'shared/types/permissionType';
import { UserGroupsLookupField } from './UserGroupsLookupField';
import { MembersList } from './MembersList';
import { loadGrantedPermissions, searchCollaborators } from '../PermissionsAPI';

export interface ShareEntityModalProps {
  isOpen: boolean;
  onClose: () => void;
  sharedIds: string[];
  saveEntitiesPermissions: (
    permissionsData: PermissionsDataSchema,
    storeKey: string
  ) => Promise<void>;
  storeKey: string;
}

const pseudoMembers: MemberWithPermission[] = [
  {
    refId: '',
    type: 'group',
    label: 'Administrators and Editors',
    level: AccessLevels.WRITE,
  },
];

const findPublicPermission = (permissions: MemberWithPermission[]) =>
  permissions.find(p => p.type === PermissionType.PUBLIC);

const getWarningMessage = (publishingLevel: MixedAccessLevels | false) =>
  !publishingLevel ? (
    <Translate translationKey="Private entities description">
      Caution: the selected entities will be **private**. Only allowed users will be able to see
      them.
    </Translate>
  ) : (
    <Translate translationKey="Public entities description">
      Caution: the selected entities will be **public**. Anyone will be able to see them.
    </Translate>
  );

export const ShareEntityModalComponent = ({
  isOpen,
  onClose,
  sharedIds,
  saveEntitiesPermissions: savePermissions,
  storeKey,
}: ShareEntityModalProps) => {
  const [results, setResults] = useState<MemberWithPermission[]>([]);
  const [assignments, setAssignments] = useState<MemberWithPermission[]>([]);
  const [dirty, setDirty] = useState(false);
  const [originalPublicLevel, setOriginalPublicLevel] = useState<MixedAccessLevels | false>(false);

  const searchAndLoadCollabs = async (
    searchTerm: string,
    currentAssignments: MemberWithPermission[]
  ) => {
    const collaborators = await searchCollaborators(searchTerm);
    setResults(
      collaborators.filter(
        r => !currentAssignments.find(a => a.refId === r.refId && a.type === r.type)
      )
    );
  };

  useEffect(() => {
    loadGrantedPermissions(sharedIds)
      .then(permissions => {
        const loadedAssignments = permissions.map(p => ({ ...p, refId: p.refId }));
        setAssignments(loadedAssignments);

        const publicPermission = findPublicPermission(permissions);
        setOriginalPublicLevel(publicPermission?.level || false);

        searchAndLoadCollabs('', loadedAssignments).catch(() => {});
      })
      .catch(() => {});

    return () => {
      setAssignments([]);
      setResults([]);
      setDirty(false);
      setOriginalPublicLevel(false);
    };
  }, []);

  const onChangeHandler = async (value: string) => {
    await searchAndLoadCollabs(value, assignments);
  };

  const onSelectHandler = (value: MemberWithPermission) => {
    setAssignments([...assignments, { ...value, level: value.level || AccessLevels.READ }]);
    setResults(results.filter(r => !(value.refId === r.refId && value.type === r.type)));
    setDirty(true);
  };

  const onSaveHandler = async () => {
    await savePermissions(
      {
        ids: sharedIds,
        permissions: assignments.map(a => ({
          refId: a.refId,
          type: a.type,
          level: a.level as MixedAccessLevels,
        })),
      },
      storeKey
    );
    return onClose();
  };

  const members = pseudoMembers.concat(assignments);
  const currentPublicLevel = findPublicPermission(members)?.level || false;

  return (
    <Modal isOpen={isOpen} type="content" className="share-modal" zIndex={1000}>
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
          onChange={onChangeHandler}
          onSelect={onSelectHandler}
          options={results}
        />
        <div className="member-list-wrapper">
          <MembersList
            members={members}
            onChange={value => {
              setAssignments(value.filter(m => m.refId));
              setDirty(true);
            }}
          />
        </div>
        {originalPublicLevel !== currentPublicLevel ? (
          <span className="validation-message">{getWarningMessage(currentPublicLevel)}</span>
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

const mapDispatchToProps = {
  saveEntitiesPermissions,
};

export const ShareEntityModal = connect(null, mapDispatchToProps)(ShareEntityModalComponent);
