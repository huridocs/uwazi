import React from 'react';
import { ConfirmationModal } from 'V2/Components/UI/ConfirmationModal';
import { Translate } from 'app/I18N';
import { TemplateRow } from '../types';

interface DeleteTemplatesConfirmationModalProps {
  open: boolean;
  onAccept: (templates: TemplateRow[]) => void;
  onCancel: () => void;
  templates: TemplateRow[];
}

const DeleteTemplatesConfirmationModal = ({
  open,
  onAccept,
  onCancel,
  templates,
}: DeleteTemplatesConfirmationModalProps) => {
  if (!open) return null;

  return (
    <ConfirmationModal
      header={<Translate>Delete</Translate>}
      warningText={<Translate>Do you want to delete the following items?</Translate>}
      body={
        <ul className="flex flex-wrap max-w-md gap-8 list-disc list-inside">
          {templates.map(item => (
            <li key={item.name}>{item.name}</li>
          ))}
        </ul>
      }
      acceptButton={<Translate>Delete</Translate>}
      cancelButton={<Translate>Cancel</Translate>}
      onAcceptClick={() => onAccept(templates)}
      onCancelClick={onCancel}
      dangerStyle
    />
  );
};

export { DeleteTemplatesConfirmationModal };
