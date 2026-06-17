import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { useMetadataEditing } from '../context/EntityScopedProvider.js';

const MetadataDisplayFooter = () => {
  const { isEditing, setIsEditing } = useMetadataEditing();

  return (
    <div className="flex w-full flex-row items-center justify-between gap-3">
      {isEditing ? (
        <>
          <Button variant="secondary" onClick={() => setIsEditing(false)}>
            <Translate>Cancel</Translate>
          </Button>
          <Button variant="primary" type="submit" form="edit-entity-form">
            <Translate>Save</Translate>
          </Button>
        </>
      ) : (
        <>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setIsEditing(true)}>
              <Translate>Edit</Translate>
            </Button>
            <Button variant="secondary">
              <Translate>Share</Translate>
            </Button>
          </div>
          <Button variant="danger">
            <Translate>Delete</Translate>
          </Button>
        </>
      )}
    </div>
  );
};

export { MetadataDisplayFooter };
