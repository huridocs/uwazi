import React from 'react';
import { Translate, I18NLinkV2 as I18NLink } from 'app/I18N';
import { Button } from 'V2/Components/UI';

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
          <Button color="primary" onClick={onAddProperty}>
            <Translate>Add property</Translate>
          </Button>
          <Button color="primary" styling="outline" onClick={onAddThesaurus}>
            <Translate>Add thesaurus</Translate>
          </Button>
          <Button color="primary" styling="outline" onClick={onAddRelationshipType}>
            <Translate>Add relationship type</Translate>
          </Button>
        </>
      ) : (
        <>
          <Button color="error" onClick={onDelete}>
            <Translate>Remove</Translate>
          </Button>
          <span className="text-gray-700">
            <Translate>Selected</Translate> {selected.length}
          </span>
        </>
      )}
    </div>
    <div className="flex gap-2">
      <I18NLink to="/settings/templates">
        <Button styling="outline">
          <Translate>Cancel</Translate>
        </Button>
      </I18NLink>
      <Button color="success" onClick={onSave} disabled={disableSave}>
        <Translate>Save</Translate>
      </Button>
    </div>
  </div>
);
