import React from 'react';
import { FormProvider } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { t, Translate } from '#app/I18N/index.js';
import { Button } from '#V2/Components/UI/index.js';
import { useIsMobile } from '#V2/CustomHooks/useIsMobile.js';
import { EditEntity, submitEditEntityForm } from '#V2/Components/Metadata/EntityEditor/index.js';
import {
  PdfFillProvider,
  defaultPdfFillHost,
} from '#V2/Components/Metadata/EntityEditor/Components/EntityPdfFill.js';
import { DocumentInteractionProvider } from '#V2/Routes/Entity/Components/context/DocumentInteractionContext.js';
import { useMetadataEditing } from '#V2/Routes/Entity/Components/context/MetadataEditingContext.js';
import { EntityTabFooter } from '#V2/Routes/Entity/Tabs/EntityTabFooter.js';
import { LibraryFooterButton } from './LibraryFooterButton.js';
import { useLibraryCreateEntity } from './useLibraryCreateEntity.js';

type LibraryCreateEntityFormProps = {
  onClose: () => void;
  create: ReturnType<typeof useLibraryCreateEntity>;
};

const createPdfFill = (language: string) => ({
  ...defaultPdfFillHost,
  isEditing: true,
  language,
});

const LibraryCreateEntityForm = ({ onClose, create }: LibraryCreateEntityFormProps) => {
  const { entity, form, formId, mediaUpload, saving, saveError, editErrors, onSave } = create;
  const { setTranslationsPending, registerCancelTranslations, requestStopTranslations } =
    useMetadataEditing();
  const isMobile = useIsMobile();
  const requestClose = () => requestStopTranslations(onClose);

  return (
    <DocumentInteractionProvider>
      <div
        className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-paper"
        data-testid="library-create-entity"
      >
        <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2.5">
          <h2 className="text-sm font-semibold text-ink">
            <Translate>New entity</Translate>
          </h2>
          {isMobile ? null : (
            <button
              type="button"
              onClick={requestClose}
              disabled={saving}
              className="shrink-0 rounded-md p-1.5 text-ink-muted transition-colors hover:bg-warm hover:text-ink disabled:cursor-default disabled:opacity-40"
              aria-label={t('System', 'Close', null, false)}
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
          {saveError ? (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {saveError}
            </p>
          ) : null}
          <PdfFillProvider value={createPdfFill(entity.language)}>
            {/* oxlint-disable-next-line react/jsx-props-no-spreading */}
            <FormProvider {...form}>
              <EditEntity
                formId={formId}
                form={form}
                entity={entity}
                mediaUpload={mediaUpload}
                onSave={onSave}
                disabled={saving}
                errors={editErrors}
                onTranslationPendingChange={setTranslationsPending}
                onRegisterCancelTranslations={registerCancelTranslations}
                onTranslationSaveAttempt={() => {
                  requestStopTranslations(() => submitEditEntityForm(formId));
                }}
              />
            </FormProvider>
          </PdfFillProvider>
        </div>
        <EntityTabFooter inset="side">
          <div className="flex w-full items-center justify-end gap-2">
            <LibraryFooterButton onClick={requestClose} disabled={saving}>
              <Translate>Cancel</Translate>
            </LibraryFooterButton>
            <Button type="submit" variant="success" form={formId} disabled={saving}>
              <Translate>Save</Translate>
            </Button>
          </div>
        </EntityTabFooter>
      </div>
    </DocumentInteractionProvider>
  );
};

export { LibraryCreateEntityForm };
