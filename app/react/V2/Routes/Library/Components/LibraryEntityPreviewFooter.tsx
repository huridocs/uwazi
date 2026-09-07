import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import {
  EntityWriteAuthorization,
  useEntityScopedEntity,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/index.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { MAIN_TAB, type MainTabId } from '#V2/Routes/Entity/Tabs/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';

type LibraryEntityPreviewFooterProps = {
  entityBasePath: string;
  onClose: () => void;
  mainTabId: MainTabId;
};

const LibraryEntityPreviewFooter = ({
  entityBasePath,
  onClose,
  mainTabId,
}: LibraryEntityPreviewFooterProps) => {
  const entity = useEntityScopedEntity();
  const { isEditing, isSaving, formMountHost, formId, cancelEdit, startEditing } =
    useMetadataEditing();
  const href = `${entityBasePath.replace(/^\//, '')}/${entity.sharedId}`;
  const editingMetadata = isEditing && formMountHost === 'main';
  const showEdit = mainTabId === MAIN_TAB.METADATA && !editingMetadata;

  return (
    <EntityTabFooter inset="side">
      <div
        className="flex w-full items-center justify-between gap-2"
        data-testid="library-entity-preview-footer"
      >
        {editingMetadata ? (
          <>
            <span />
            <div className="flex items-center gap-2">
              <Button type="button" variant="warm" onClick={cancelEdit} disabled={isSaving}>
                <Translate>Cancel</Translate>
              </Button>
              <Button type="submit" variant="success" form={formId} disabled={isSaving}>
                <Translate>Save</Translate>
              </Button>
            </div>
          </>
        ) : (
          <>
            <div>
              {showEdit ? (
                <EntityWriteAuthorization>
                  <LibraryFooterButton onClick={() => startEditing('main')}>
                    <Translate>Edit</Translate>
                  </LibraryFooterButton>
                </EntityWriteAuthorization>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <LibraryFooterButton onClick={onClose}>
                <Translate>Close</Translate>
              </LibraryFooterButton>
              <I18NLinkV2
                to={href}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1.5 text-tab font-medium text-parchment transition-colors"
                style={{ backgroundColor: 'var(--text-primary)' }}
              >
                <Translate>View entity</Translate>
                <ArrowRightIcon className="h-3.5 w-3.5" />
              </I18NLinkV2>
            </div>
          </>
        )}
      </div>
    </EntityTabFooter>
  );
};

export type { LibraryEntityPreviewFooterProps };
export { LibraryEntityPreviewFooter };
