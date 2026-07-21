import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import type { useToCPanel } from './useToCPanel.js';

type ToCFooterBarProps = {
  panel: ReturnType<typeof useToCPanel>;
};

const ToCFooterBar = ({ panel }: ToCFooterBarProps) => {
  const { tocState, isSaving, handleEdit, handleSave, handleCancel } = panel;

  return (
    <EntityWriteAuthorization>
      <div className="flex gap-2">
        {!tocState.isEditMode ? (
          <>
            <Button variant="secondary" onClick={handleEdit}>
              <Translate>Edit</Translate>
            </Button>
            <Button variant="secondary">
              <Translate>Mark as reviewed</Translate>
            </Button>
          </>
        ) : (
          <>
            <Button variant="success" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Translate>Saving...</Translate> : <Translate>Save</Translate>}
            </Button>
            <Button variant="secondary" onClick={handleCancel}>
              <Translate>Cancel</Translate>
            </Button>
          </>
        )}
      </div>
    </EntityWriteAuthorization>
  );
};

export { ToCFooterBar };
