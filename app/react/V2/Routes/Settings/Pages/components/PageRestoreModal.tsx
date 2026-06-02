import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { MultiselectList } from '#app/V2/Components/Forms/index.js';

export type PageRestoreReleaseRow = {
  version: number;
  date: number;
  release_message?: string;
};

export interface PageRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  releases: PageRestoreReleaseRow[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  onRestore: () => void;
}

const PageRestoreModal = ({
  isOpen,
  onClose,
  releases,
  selectedValues,
  onSelectionChange,
  onRestore,
}: PageRestoreModalProps) => {
  const items = useMemo(
    () =>
      releases.map(r => {
        const date = new Date(r.date).toLocaleDateString();
        const message = (r.release_message || '').trim().slice(0, 48);
        return {
          label: (
            <div className="flex justify-between">
              <span>{message || '-'}</span>
              <span className="text-sm text-gray-500">{date}</span>
            </div>
          ),
          searchLabel: `${r.version} ${date} ${r.release_message ?? ''}`,
          value: String(r.version),
        };
      }),
    [releases]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Modal size="lg">
      <Modal.Header>
        <h1 className="text-xl font-medium [color:var(--color-theme-text-primary)]">
          <Translate>Restore previous version</Translate>
        </h1>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body>
        <MultiselectList
          singleSelect
          checkboxes={false}
          items={items}
          selectedValues={selectedValues}
          onChange={onSelectionChange}
          noItems={<Translate>No releases yet</Translate>}
          hideFilters={true}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="ghost" type="button" onClick={onClose}>
          <Translate>Cancel</Translate>
        </Button>
        <Button
          variant="success"
          type="button"
          disabled={selectedValues.length !== 1}
          onClick={onRestore}
        >
          <Translate>Restore</Translate>
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { PageRestoreModal };
