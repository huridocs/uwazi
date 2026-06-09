import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/Button.js';
import { NeedAuthorization } from '#V2/Components/UI/index.js';
import type { useToCPanel } from './useToCPanel.js';

type ToCFooterBarProps = {
  panel: ReturnType<typeof useToCPanel>;
};

const ToCFooterBar = ({ panel }: ToCFooterBarProps) => {
  const { tocState, isSaving, handleEdit, handleSave, handleCancel } = panel;

  return (
    <div className="flex gap-2">
      {!tocState.isEditMode ? (
        <>
          <NeedAuthorization roles={['admin', 'editor']}>
            <Button variant="secondary" onClick={handleEdit}>
              <Translate>Edit</Translate>
            </Button>
          </NeedAuthorization>
          <NeedAuthorization roles={['admin', 'editor']}>
            <Button variant="secondary">
              <Translate>Mark as reviewed</Translate>
            </Button>
          </NeedAuthorization>
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
  );
};

export { ToCFooterBar };
