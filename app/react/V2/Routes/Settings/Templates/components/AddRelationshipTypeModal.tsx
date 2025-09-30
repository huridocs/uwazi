import React, { useState, ChangeEvent } from 'react';
import { t, Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import * as relationshipTypesAPI from 'V2/api/relationshiptypes';
import { useSetAtom, useAtom } from 'jotai';
import { notificationAtom, relationshipTypesAtom } from 'V2/atoms';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';

interface AddRelationshipTypeModalProps {
  onClose: () => void;
}

export const AddRelationshipTypeModal = ({ onClose }: AddRelationshipTypeModalProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);
  const [relationshipTypes, setRelationshipTypes] = useAtom(relationshipTypesAtom);
  const [nameError, setNameError] = useState(false);

  const handleClose = () => {
    setName('');
    onClose();
  };

  const save = async () => {
    const newRelationshipType = await relationshipTypesAPI.save({ name: name.trim() });
    setRelationshipTypes([...relationshipTypes, newRelationshipType]);
    setNotifications({
      type: 'success',
      text: <Translate>Relationship type created successfully.</Translate>,
    });
  };

  const handleSave = async () => {
    const isDuplicateName = relationshipTypes.some(
      relationshipType => relationshipType.name.toLowerCase() === name.trim().toLowerCase()
    );

    if (isDuplicateName) {
      setNameError(true);
      return;
    }

    setIsSaving(true);
    try {
      await save();
    } catch (error) {
      handleUnexpectedError(error, 'Error saving relationship type');
    } finally {
      setIsSaving(false);
      handleClose();
    }
  };

  return (
    <Modal size="md">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Add relationship type</Translate>
        </h1>
        <Modal.CloseButton onClick={handleClose} />
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          <InputField
            id="relationship-type-name"
            label={<Translate>Name</Translate>}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value);
              setNameError(false);
            }}
            placeholder={t('System', 'Relationship type name', null, false)}
            hasErrors={nameError}
            errorMessage={
              nameError && name ? <Translate>Relationship type name already exists</Translate> : ''
            }
          />
          <div className="flex justify-end gap-2">
            <Button styling="outline" onClick={handleClose}>
              <Translate>Cancel</Translate>
            </Button>
            <Button color="success" onClick={handleSave} disabled={isSaving || !name.trim()}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
