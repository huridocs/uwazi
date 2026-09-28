import React from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { PlusIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { Button, useTabGroup } from '#V2/Components/UI/index.js';
import {
  EntityWriteAuthorization,
  useEntityFiles,
  useEntityScopedEntity,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/index.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { MAIN_TAB, type MainTabId } from '#V2/Routes/Entity/Tabs/index.js';
import { CopyFromTrigger } from '#V2/Components/Metadata/CopyFrom/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibrarySingleSelectActions } from './LibrarySingleSelectActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';

type LibraryEntityPreviewFooterProps = {
  entityBasePath: string;
  onClose: () => void;
  mainTabId: MainTabId;
  onAction?: (action: LibraryBulkAction) => void;
};

type PreviewBarProps = {
  editingMetadata: boolean;
  isSaving: boolean;
  formId: string;
  onDiscard: () => void;
  entityBasePath: string;
  sharedId: string;
  onAction?: (action: LibraryBulkAction) => void;
  onEdit?: () => void;
  onClose: () => void;
  href: string;
  tabActions: React.ReactNode;
};

const previewBar = ({
  editingMetadata,
  isSaving,
  formId,
  onDiscard,
  entityBasePath,
  sharedId,
  onAction,
  onEdit,
  onClose,
  href,
  tabActions,
}: PreviewBarProps) => {
  if (editingMetadata) {
    return (
      <>
        <CopyFromTrigger disabled={isSaving} />
        <div className="flex items-center gap-2">
          <Button type="button" variant="warm" onClick={onDiscard} disabled={isSaving}>
            <Translate>Cancel</Translate>
          </Button>
          <Button type="submit" variant="success" form={formId} disabled={isSaving}>
            <Translate>Save</Translate>
          </Button>
        </div>
      </>
    );
  }
  if (onAction) {
    return (
      <LibrarySingleSelectActions
        entityBasePath={entityBasePath}
        sharedId={sharedId}
        onAction={onAction}
        onEdit={onEdit}
        onClose={onClose}
        leading={tabActions}
      />
    );
  }
  return (
    <>
      <div>{tabActions}</div>
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
  );
};

const LibraryEntityPreviewFooter = ({
  entityBasePath,
  onClose,
  mainTabId,
  onAction,
}: LibraryEntityPreviewFooterProps) => {
  const entity = useEntityScopedEntity();
  const { requestAddFile } = useEntityFiles();
  const { isEditing, isSaving, formMountHost, formId, requestDiscard, startEditing } =
    useMetadataEditing();
  const { selectTab } = useTabGroup('entity-main');
  const href = `${entityBasePath.replace(/^\//, '')}/${entity.sharedId}`;
  const editingMetadata = isEditing && formMountHost === 'main';
  const showEdit = mainTabId === MAIN_TAB.METADATA && !editingMetadata && !onAction;
  const showAddFile = mainTabId === MAIN_TAB.FILES;
  const tabActions = (
    <>
      {showEdit ? (
        <EntityWriteAuthorization>
          <LibraryFooterButton onClick={() => startEditing('main')}>
            <Translate>Edit</Translate>
          </LibraryFooterButton>
        </EntityWriteAuthorization>
      ) : null}
      {showAddFile ? (
        <EntityWriteAuthorization>
          <LibraryFooterButton
            icon={<PlusIcon className="h-3.5 w-3.5 shrink-0 text-ink-tertiary" />}
            onClick={() => requestAddFile('main')}
          >
            <Translate>Add file</Translate>
          </LibraryFooterButton>
        </EntityWriteAuthorization>
      ) : null}
    </>
  );

  return (
    <EntityTabFooter inset="side">
      <div
        className="flex w-full items-center justify-between gap-2"
        data-testid="library-entity-preview-footer"
      >
        {previewBar({
          editingMetadata,
          isSaving,
          formId,
          onDiscard: () => requestDiscard('discard'),
          entityBasePath,
          sharedId: entity.sharedId,
          onAction,
          onEdit: () => {
            selectTab(MAIN_TAB.METADATA);
            startEditing('main');
          },
          onClose,
          href,
          tabActions,
        })}
      </div>
    </EntityTabFooter>
  );
};

export type { LibraryEntityPreviewFooterProps };
export { LibraryEntityPreviewFooter };
