import React, { useLayoutEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { Translate } from '#app/I18N/index.js';
import { InputField, Select } from '#V2/Components/Forms/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { foldLabel } from '../functions/addThesaurusValue.js';
import type { AddValueScope } from '../functions/addThesaurusValue.js';

type AddThesaurusValueModalProps = {
  thesaurusName: string;
  scopes: AddValueScope[];
  saving: boolean;
  onSave: (label: string, groupId: string) => void | Promise<void>;
  onClose: () => void;
};

const placementNote = (scopes: AddValueScope[], groupId: string, value: string) => {
  const scope = scopes.find(item => item.id === groupId) ?? scopes[0];
  const clean = value.trim();
  const match = clean
    ? scope?.existingLabels.find(label => foldLabel(label) === foldLabel(clean))
    : undefined;
  if (match) {
    return (
      <>
        “{match}” <Translate>already exists. Save selects it.</Translate>
      </>
    );
  }
  if (scope && scope.id !== 'root') {
    return (
      <>
        <Translate>Added in</Translate> {scope.label}.
      </>
    );
  }
  return <Translate>Added at the end of the thesaurus.</Translate>;
};

const AddThesaurusValueModal = ({
  thesaurusName,
  scopes,
  saving,
  onSave,
  onClose,
}: AddThesaurusValueModalProps) => {
  const anchorRef = useRef<HTMLSpanElement>(null);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);
  const [groupId, setGroupId] = useState(scopes[0]?.id ?? 'root');
  const [value, setValue] = useState('');
  const clean = value.trim();
  useLayoutEffect(() => {
    setPortalRoot(anchorRef.current?.closest<HTMLElement>('.tw-content') ?? document.body);
  }, []);

  const blocked = !clean || saving;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (blocked) {
      return;
    }
    await onSave(clean, groupId);
  };

  const dialog = (
    <Modal size="sm" ariaLabel="Add thesaurus value">
      <form onSubmit={submit}>
        <Modal.Header>
          <h1 className="text-xl font-medium text-ink">
            <Translate>Add thesaurus value</Translate>
          </h1>
          <Modal.CloseButton onClick={onClose} />
        </Modal.Header>
        <Modal.Body className="flex flex-col gap-4">
          {scopes.length > 1 && (
            <Select
              id="add-thesaurus-value-group"
              label={<Translate>Group</Translate>}
              options={scopes.map(item => ({ value: item.id, label: item.label }))}
              value={groupId}
              onChange={event => setGroupId(event.target.value)}
            />
          )}
          <InputField
            id="add-thesaurus-value"
            label={
              <>
                <Translate>New value in</Translate> {thesaurusName}
              </>
            }
            value={value}
            onChange={event => setValue(event.target.value)}
          />
          <p id="add-thesaurus-value-note" className="text-meta text-ink-tertiary">
            {placementNote(scopes, groupId, value)}
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" type="button" onClick={onClose}>
            <Translate>Cancel</Translate>
          </Button>
          <Button variant="success" type="submit" disabled={blocked}>
            <Translate>Save</Translate>
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );

  return (
    <>
      <span ref={anchorRef} hidden />
      {portalRoot ? createPortal(dialog, portalRoot) : null}
    </>
  );
};

export { AddThesaurusValueModal };
export type { AddThesaurusValueModalProps };
