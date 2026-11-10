import React, { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { ArrowRightIcon } from '@heroicons/react/20/solid';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { Button } from '#V2/Components/UI/index.js';
import {
  useEntityLanguage,
  useEntityFiles,
  useEntityScopedEntity,
  useEntityWriteAuthorized,
  useMetadataEditing,
  useExitRelationshipsEdit,
  useRelationshipsSelection,
  type MetadataEditingHost,
} from '#V2/Routes/Entity/Components/index.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { MAIN_TAB, type SideTabId } from '#V2/Routes/Entity/Tabs/index.js';
import { DocumentTabFooter } from '#V2/Routes/Entity/Tabs/footers/DocumentTabFooter.js';
import { RelationshipsTabFooter } from '#V2/Routes/Entity/Tabs/footers/RelationshipsTabFooter.js';
import { CopyFromTrigger } from '#V2/Components/Metadata/CopyFrom/index.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { LibrarySingleSelectActions } from './LibrarySingleSelectActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';

type LibraryEntityPreviewFooterProps = {
  entityBasePath: string;
  onClose: () => void;
  mainTabId: SideTabId;
  onAction?: (action: LibraryBulkAction) => void;
};

type PreviewShellProps = {
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
  includeActions?: boolean;
};

const previewShell = ({
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
  includeActions = true,
}: PreviewShellProps) => {
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
        includeActions={includeActions}
      />
    );
  }
  return (
    <div className="ms-auto flex items-center gap-2">
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
  );
};

const useClearFilesSelection = (mainTabId: SideTabId) => {
  const { setSelectedRowIds, closeFilePreview } = useEntityFiles();
  const onFilesRef = useRef(mainTabId === MAIN_TAB.FILES);

  useEffect(() => {
    const onFiles = mainTabId === MAIN_TAB.FILES;
    if (onFilesRef.current && !onFiles) {
      setSelectedRowIds([]);
      closeFilePreview();
    }
    onFilesRef.current = onFiles;
  }, [closeFilePreview, mainTabId, setSelectedRowIds]);
};

type ActiveTabFooterInput = {
  mainTabId: SideTabId;
  mainDocument?: FileType;
  relationshipsEditMode: boolean;
  entityBasePath: string;
  sharedId: string;
  onClose: () => void;
};

const activeTabFooter = ({
  mainTabId,
  mainDocument,
  relationshipsEditMode,
  entityBasePath,
  sharedId,
  onClose,
}: ActiveTabFooterInput) => {
  if (mainTabId === MAIN_TAB.DOCUMENT && mainDocument?.filename) {
    return (
      <DocumentTabFooter
        mainDocument={mainDocument}
        inset="side"
        pageNavAlign="start"
        trailing={
          <LibrarySingleSelectActions
            entityBasePath={entityBasePath}
            sharedId={sharedId}
            onClose={onClose}
            includeActions={false}
          />
        }
      />
    );
  }
  if (mainTabId === MAIN_TAB.RELATIONSHIPS && relationshipsEditMode) {
    return <RelationshipsTabFooter inset="side" />;
  }
  return null;
};

type EditForTabInput = {
  mainTabId: SideTabId;
  canEdit: boolean;
  startEditing: (host: MetadataEditingHost) => void;
  setRelationshipsEditMode: Dispatch<SetStateAction<boolean>>;
};

const editForTab = ({
  mainTabId,
  canEdit,
  startEditing,
  setRelationshipsEditMode,
}: EditForTabInput) => {
  if (!canEdit) return undefined;
  if (mainTabId === MAIN_TAB.METADATA) return () => startEditing('main');
  if (mainTabId === MAIN_TAB.RELATIONSHIPS) return () => setRelationshipsEditMode(true);
  return undefined;
};

const useLibraryPreviewFooterState = (mainTabId: SideTabId) => {
  const entity = useEntityScopedEntity();
  const { mainDocument } = useEntityLanguage();
  const { relationshipsEditMode, setRelationshipsEditMode } = useRelationshipsSelection();
  const { filePanelMode } = useEntityFiles();
  const canEdit = useEntityWriteAuthorized();
  const editing = useMetadataEditing();
  useClearFilesSelection(mainTabId);
  useExitRelationshipsEdit(mainTabId === MAIN_TAB.RELATIONSHIPS);
  return {
    entity,
    mainDocument,
    relationshipsEditMode,
    setRelationshipsEditMode,
    filePanelMode,
    canEdit,
    editing,
  };
};

const LibraryEntityPreviewFooter = ({
  entityBasePath,
  onClose,
  mainTabId,
  onAction,
}: LibraryEntityPreviewFooterProps) => {
  const state = useLibraryPreviewFooterState(mainTabId);
  const viewingFile = mainTabId === MAIN_TAB.FILES && state.filePanelMode === 'preview';
  const close = () => state.editing.requestStopTranslations(onClose);
  const switched = activeTabFooter({
    mainTabId,
    mainDocument: state.mainDocument,
    relationshipsEditMode: state.relationshipsEditMode,
    entityBasePath,
    sharedId: state.entity.sharedId,
    onClose: close,
  });
  if (switched) return switched;

  return (
    <EntityTabFooter inset="side">
      <div
        className="flex w-full items-center justify-between gap-2"
        data-testid="library-entity-preview-footer"
      >
        {previewShell({
          editingMetadata:
            mainTabId === MAIN_TAB.METADATA &&
            state.editing.isEditing &&
            state.editing.formMountHost === 'main',
          isSaving: state.editing.isSaving,
          formId: state.editing.formId,
          onDiscard: () =>
            state.editing.requestStopTranslations(() => state.editing.requestDiscard('discard')),
          entityBasePath,
          sharedId: state.entity.sharedId,
          onAction,
          includeActions: !viewingFile,
          onEdit: editForTab({
            mainTabId,
            canEdit: state.canEdit,
            startEditing: state.editing.startEditing,
            setRelationshipsEditMode: state.setRelationshipsEditMode,
          }),
          onClose: close,
          href: `${entityBasePath.replace(/^\//, '')}/${state.entity.sharedId}`,
        })}
      </div>
    </EntityTabFooter>
  );
};

export type { LibraryEntityPreviewFooterProps };
export { LibraryEntityPreviewFooter };
