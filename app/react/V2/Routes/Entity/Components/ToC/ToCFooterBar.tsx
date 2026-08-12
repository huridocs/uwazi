import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { EntityWriteAuthorization } from '#V2/Routes/Entity/Components/context/index.js';
import type { useToCPanel } from './useToCPanel.js';

type ToCFooterBarProps = {
  panel: ReturnType<typeof useToCPanel>;
};

const ToCFooterBar = ({ panel }: ToCFooterBarProps) => {
  const {
    tocState,
    isSaving,
    canMarkReviewed,
    handleEdit,
    handleSave,
    handleCancel,
    handleMarkReviewed,
  } = panel;

  return (
    <EntityWriteAuthorization>
      {!tocState.isEditMode ? (
        <div className="flex w-full items-center justify-between gap-2">
          <Button variant="secondary" onClick={handleEdit} disabled={isSaving}>
            <Translate>Edit</Translate>
          </Button>
          {canMarkReviewed ? (
            <Button variant="secondary" onClick={handleMarkReviewed} disabled={isSaving}>
              <Translate>Mark as reviewed</Translate>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="flex w-full items-center gap-2">
          <Button variant="success" onClick={handleSave} disabled={isSaving}>
            {isSaving ? <Translate>Saving...</Translate> : <Translate>Save</Translate>}
          </Button>
          <Button variant="secondary" onClick={handleCancel} disabled={isSaving}>
            <Translate>Cancel</Translate>
          </Button>
        </div>
      )}
    </EntityWriteAuthorization>
  );
};

export { ToCFooterBar };
