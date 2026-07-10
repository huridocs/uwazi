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
      <div className="flex w-full flex-row items-center justify-between gap-3">
        {isEditing ? (
          <>
            <Button variant="secondary" onClick={cancelEdit}>
              <Translate>Cancel</Translate>
            </Button>
            <Button variant="primary" type="submit" form="edit-entity-form" disabled={isSaving}>
              <Translate>Save</Translate>
            </Button>
          </>
        ) : (
          <>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-1.5"
              >
                <PencilSquareIcon className={iconClass} />
                <Translate>Edit</Translate>
              </Button>
              <Button variant="secondary" className="inline-flex items-center gap-1.5">
                <ShareIcon className={iconClass} />
                <Translate>Share</Translate>
              </Button>
            </div>
            <Button variant="danger" className="inline-flex items-center gap-1.5">
              <TrashIcon className={iconClass} />
              <Translate>Delete</Translate>
            </Button>
          </>
        )}
      </div>
    </EntityWriteAuthorization>
  );
};

export { MetadataDisplayFooter };
