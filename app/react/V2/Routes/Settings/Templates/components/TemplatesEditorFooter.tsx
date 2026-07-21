import React from 'react';
import { Translate, I18NLinkV2 as I18NLink } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';

interface TemplatesEditorFooterProps {
  selected: string[];
  onDelete: () => void;
  onSave: () => void;
  onAddThesaurus: () => void;
  onAddRelationshipType: () => void;
  onAddProperty: () => void;
  disableSave?: boolean;
}

export const TemplatesEditorFooter = ({
  selected,
  onDelete,
  onSave,
  onAddThesaurus,
  onAddRelationshipType,
  onAddProperty,
  disableSave,
}: TemplatesEditorFooterProps) => (
  <div className="flex justify-between w-full">
    <div className="flex gap-2 items-center">
      {selected.length === 0 ? (
        <>
          <Button variant="primary" onClick={onAddProperty}>
            <Translate>Add property</Translate>
          </Button>
          <Button variant="secondary" onClick={onAddThesaurus}>
            <Translate>Add thesaurus</Translate>
          </Button>
          <Button variant="secondary" onClick={onAddRelationshipType}>
            <Translate>Add relationship type</Translate>
          </Button>
        </>
      ) : (
        <>
          <Button variant="danger" onClick={onDelete}>
            <Translate>Remove</Translate>
          </Button>
          <span className="text-ink-secondary">
            <Translate>Selected</Translate> {selected.length}
          </span>
        </>
      )}
    </div>
    <div className="flex gap-2">
      <I18NLink to="/settings/templates">
        <Button variant="secondary">
          <Translate>Cancel</Translate>
        </Button>
      </I18NLink>
      <Button variant="success" onClick={onSave} disabled={disableSave}>
        <Translate>Save</Translate>
      </Button>
    </div>
  </div>
);
