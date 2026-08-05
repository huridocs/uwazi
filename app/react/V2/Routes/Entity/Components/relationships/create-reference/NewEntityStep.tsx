import React from 'react';
import { Translate } from '#app/I18N/index.js';
import type { Template } from '#app/apiResponseTypes.js';
import { Button, Modal } from '#V2/Components/UI/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';

type NewEntityStepProps = {
  newEntityTitle: string;
  setNewEntityTitle: (value: string) => void;
  newEntityTemplateId: string;
  setNewEntityTemplateId: (value: string) => void;
  templates: Template[];
  isSaving: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

const NewEntityStep = ({
  newEntityTitle,
  setNewEntityTitle,
  newEntityTemplateId,
  setNewEntityTemplateId,
  templates,
  isSaving,
  onBack,
  onConfirm,
}: NewEntityStepProps) => (
  <>
    <Modal.Body className="space-y-4">
      <div>
        <label
          htmlFor="new-entity-title"
          className="mb-1.5 block text-xs font-medium text-ink-secondary"
        >
          <Translate>Title</Translate>
        </label>
        <input
          id="new-entity-title"
          type="text"
          value={newEntityTitle}
          onChange={event => setNewEntityTitle(event.target.value)}
          className="w-full rounded-md border border-border bg-warm px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-carbon/20"
        />
        <p className="mt-1 text-micro text-ink-tertiary">
          <Translate>Pre-filled from your selection. Edit as needed.</Translate>
        </p>
      </div>
      <div>
        <span className="mb-1.5 block text-xs font-medium text-ink-secondary">
          <Translate>Entity type</Translate>
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {templates.map(template => (
            <button
              key={template._id}
              type="button"
              onClick={() => setNewEntityTemplateId(template._id)}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                newEntityTemplateId === template._id
                  ? 'bg-warm ring-1 ring-carbon/30'
                  : 'hover:bg-warm'
              }`}
            >
              <TemplateLabel templateId={template._id} />
            </button>
          ))}
        </div>
      </div>
    </Modal.Body>
    <Modal.Footer className="flex justify-between">
      <Button variant="secondary" onClick={onBack} disabled={isSaving}>
        <Translate>Back</Translate>
      </Button>
      <Button
        variant="primary"
        onClick={onConfirm}
        disabled={!newEntityTitle.trim() || !newEntityTemplateId || isSaving}
      >
        <Translate>Create entity</Translate>
      </Button>
    </Modal.Footer>
  </>
);

export { NewEntityStep };
