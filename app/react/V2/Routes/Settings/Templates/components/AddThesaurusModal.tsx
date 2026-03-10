import React, { useState, ChangeEvent } from 'react';
import { t, Translate } from 'app/I18N';
import { Modal, Button } from 'V2/Components/UI';
import { InputField } from 'V2/Components/Forms';
import { save as saveThesauri } from 'V2/api/thesauri';
import { useSetAtom, useAtomValue } from 'jotai';
import { notificationAtom, thesauriAtom } from 'V2/atoms';
import { sanitizeThesaurusName } from 'shared/sanitizationUtils';
import { handleUnexpectedError } from 'app/V2/shared/errorUtils';

interface AddThesaurusModalProps {
  onClose: () => void;
}

export const AddThesaurusModal = ({ onClose }: AddThesaurusModalProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const setNotifications = useSetAtom(notificationAtom);
  const setThesauri = useSetAtom(thesauriAtom);
  const thesauri = useAtomValue(thesauriAtom);
  const [nameError, setNameError] = useState(false);

  const handleClose = () => {
    setName('');
    onClose();
  };

  const save = async () => {
    const newThesaurus = {
      name: sanitizeThesaurusName(name),
      values: [],
    };
    const savedThesaurus = await saveThesauri(newThesaurus);
    setThesauri([...thesauri, savedThesaurus]);
    setNotifications({
      type: 'success',
      text: <Translate>Thesaurus created successfully.</Translate>,
    });
  };

  const handleSave = async () => {
    const isDuplicateName = thesauri.some(
      thesaurus => thesaurus.name.toLowerCase() === sanitizeThesaurusName(name).toLowerCase()
    );

    if (isDuplicateName) {
      setNameError(true);
      return;
    }

    setIsSaving(true);
    try {
      await save();
    } catch (error) {
      handleUnexpectedError(error, 'Error creating thesaurus');
    } finally {
      setIsSaving(false);
      handleClose();
    }
  };

  return (
    <Modal size="md">
      <Modal.Header>
        <h1 className="text-xl font-medium text-gray-900">
          <Translate>Add thesaurus</Translate>
        </h1>
        <Modal.CloseButton onClick={handleClose} />
      </Modal.Header>
      <Modal.Body>
        <div className="flex flex-col gap-4">
          <InputField
            id="thesaurus-name"
            label={<Translate>Name</Translate>}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setName(e.target.value);
              setNameError(false);
            }}
            placeholder={t('System', 'Thesaurus name', null, false)}
            hasErrors={nameError}
            errorMessage={
              nameError && name ? <Translate>Thesaurus name already exists</Translate> : ''
            }
          />
          <div className="flex justify-end gap-2">
            <Button styling="outline" onClick={handleClose}>
              <Translate>Cancel</Translate>
            </Button>
            <Button
              color="success"
              onClick={handleSave}
              disabled={isSaving || !sanitizeThesaurusName(name)}
            >
              <Translate>Save</Translate>
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};
