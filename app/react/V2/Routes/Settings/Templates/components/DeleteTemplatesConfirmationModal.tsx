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

  let body: React.ReactNode = null;

  body = (
    <div>
      <p className="font-medium mb-2">
        <Translate>The following templates can be safely deleted:</Translate>
      </p>
      <ul className="list-disc list-inside break-words">
        {templates.map(template => (
          <li key={template._id}>{template.name}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <ConfirmationModal
      header={<Translate>Delete templates</Translate>}
      body={body}
      acceptButton={<Translate>Delete</Translate>}
      cancelButton={<Translate>Cancel</Translate>}
      onAcceptClick={() => onAccept(templates)}
      onCancelClick={onCancel}
      dangerStyle
    />
  );
};

export { DeleteTemplatesConfirmationModal };
