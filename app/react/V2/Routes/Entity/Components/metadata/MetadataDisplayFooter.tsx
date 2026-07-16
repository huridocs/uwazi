import React from 'react';
import { PencilSquareIcon, ShareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import {
  EntityWriteAuthorization,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';

const iconClass = 'h-4 w-4 shrink-0';

const MetadataDisplayFooter = () => {
  const { isEditing, isSaving, cancelEdit, setIsEditing } = useMetadataEditing();

  return (
    <EntityWriteAuthorization>
      {isEditing ? (
        <div className="flex w-full items-center justify-end gap-3">
          <Button type="button" variant="warm" onClick={cancelEdit}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" variant="success" form="edit-entity-form" disabled={isSaving}>
            <Translate>Save</Translate>
          </Button>
        </div>
      ) : (
        <div className="flex w-full items-center gap-3">
          <div className="flex gap-2">
            <Button
              variant="warm"
              className="inline-flex items-center gap-1.5"
              onClick={() => setIsEditing(true)}
            >
              <PencilSquareIcon className={iconClass} />
              <Translate>Edit</Translate>
            </Button>
            <Button variant="warm" className="inline-flex items-center gap-1.5">
              <ShareIcon className={iconClass} />
              <Translate>Share</Translate>
            </Button>
          </div>
          <div className="flex-1" />
          <Button variant="dangerSubtle" className="inline-flex items-center gap-1.5">
            <TrashIcon className={iconClass} />
            <Translate>Delete</Translate>
          </Button>
        </div>
      )}
    </EntityWriteAuthorization>
  );
};

export { MetadataDisplayFooter };
