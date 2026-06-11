import React, { useMemo, useState } from 'react';
import { useAtomValue } from 'jotai';
import { Modal } from '#V2/Components/UI/Modal.js';
import { Button } from '#V2/Components/UI/Button.js';
import { InputField } from '#V2/Components/Forms/InputField.js';
import { templatesAtom } from '#V2/atoms/index.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';

type AddDataSourceModalProps = {
  usedTemplateIds: string[];
  onAdd: (source: DatavizSource) => void;
  onClose: () => void;
};

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

const AddDataSourceModal = ({ usedTemplateIds, onAdd, onClose }: AddDataSourceModalProps) => {
  const templates = useAtomValue(templatesAtom);
  const [search, setSearch] = useState('');

  const available = useMemo(
    () =>
      templates.filter(
        t => t._id && !usedTemplateIds.includes(t._id) && t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [templates, usedTemplateIds, search]
  );

  return (
    <Modal size="md">
      <Modal.Header>
        <span className="text-lg font-semibold">Add data source</span>
        <Modal.CloseButton onClick={onClose} />
      </Modal.Header>
      <Modal.Body>
        <InputField
          id="source-search"
          label="Search templates"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Type to filter…"
        />
        <ul className="mt-4 max-h-60 space-y-1 overflow-y-auto">
          {available.length === 0 && (
            <li className="text-sm text-ink-secondary">No templates available to add.</li>
          )}
          {available.map(template => (
            <li key={template._id}>
              <button
                type="button"
                className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-vellum"
                onClick={() => {
                  onAdd({
                    templateId: template._id!,
                    alias: slugify(template.name),
                  });
                  onClose();
                }}
              >
                {template.name}
              </button>
            </li>
          ))}
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <Button type="button" variant="secondary" size="small" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export { AddDataSourceModal };
