import React, { useState, ChangeEvent } from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { Modal, Button } from '#V2/Components/UI/index.js';
import { InputField } from '#V2/Components/Forms/index.js';
import { useServices } from '#V2/services/index.js';
import { useAtomValue, useSetAtom } from 'jotai';
import { thesauriAtom } from '#V2/atoms/index.js';
import { sanitizeThesaurusName } from '#shared/sanitizationUtils.js';
import { handleUnexpectedError } from '#app/V2/shared/errorUtils.js';
import { useRequestStatus } from '#V2/atoms/requestStatusAtom.js';

interface AddThesaurusModalProps {
  onClose: () => void;
}

export const AddThesaurusModal = ({ onClose }: AddThesaurusModalProps) => {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { notify } = useRequestStatus();
  const { thesauri: thesaurusService } = useServices();
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
    const [savedThesaurus, error] = await thesaurusService.upsert(newThesaurus);
    if (error || !savedThesaurus) {
      throw error ?? new Error('Error creating thesaurus');
    }
    setThesauri([...thesauri, savedThesaurus]);
    notify('success', t('System', 'Thesaurus created successfully.', null, false));
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
        <h1 className="text-xl font-medium text-ink">
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
            <Button variant="secondary" onClick={handleClose}>
              <Translate>Cancel</Translate>
            </Button>
            <Button
              variant="success"
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
