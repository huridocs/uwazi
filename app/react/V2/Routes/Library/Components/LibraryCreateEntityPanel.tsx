import React from 'react';
import { FormProvider } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { EditEntity } from '#V2/Components/Metadata/EntityEditor/index.js';
import {
  PdfFillProvider,
  defaultPdfFillHost,
} from '#V2/Components/Metadata/EntityEditor/Components/EntityPdfFill.js';
import { DocumentInteractionProvider } from '#V2/Routes/Entity/Components/context/DocumentInteractionContext.js';
import { EntityProvider } from '#V2/Routes/Entity/Components/context/EntityContext.js';
import { MetadataEditingProvider } from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { useLibraryCreateEntity } from './useLibraryCreateEntity.js';

type LibraryCreateEntityPanelProps = {
  onClose: () => void;
  onCreated: (sharedId: string) => void;
};

const createPdfFill = (language: string) => ({
  ...defaultPdfFillHost,
  isEditing: true,
  language,
});

const LibraryCreateEntityPanel = ({ onClose, onCreated }: LibraryCreateEntityPanelProps) => {
  const { entity, form, formId, mediaUpload, saving, saveError, editErrors, onSave } =
    useLibraryCreateEntity(onCreated);

  return (
    <EntityProvider entity={entity}>
      <MetadataEditingProvider>
        <DocumentInteractionProvider>
          <div
            className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
            data-testid="library-create-entity"
          >
            <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2.5">
              <h2 className="text-sm font-semibold text-ink">
                <Translate>New entity</Translate>
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink"
                aria-label={t('System', 'Close', null, false)}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
              {saveError ? (
                <p className="mb-3 text-sm text-red-600" role="alert">
                  {saveError}
                </p>
              ) : null}
              <PdfFillProvider value={createPdfFill(entity.language)}>
                <FormProvider {...form}>
                  <EditEntity
                    formId={formId}
                    form={form}
                    entity={entity}
                    mediaUpload={mediaUpload}
                    onSave={onSave}
                    disabled={saving}
                    errors={editErrors}
                  />
                </FormProvider>
              </PdfFillProvider>
            </div>
            <EntityTabFooter inset="side">
              <div className="flex w-full items-center justify-end gap-2">
                <LibraryFooterButton onClick={onClose} disabled={saving}>
                  <Translate>Cancel</Translate>
                </LibraryFooterButton>
                <Button type="submit" variant="success" form={formId} disabled={saving}>
                  <Translate>Save</Translate>
                </Button>
              </div>
            </EntityTabFooter>
          </div>
        </DocumentInteractionProvider>
      </MetadataEditingProvider>
    </EntityProvider>
  );
};

export type { LibraryCreateEntityPanelProps };
export { LibraryCreateEntityPanel };
