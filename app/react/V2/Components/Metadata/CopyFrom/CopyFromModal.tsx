import React from 'react';
import { useAtomValue } from 'jotai';
import { useWatch } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Modal } from '#V2/Components/UI/index.js';
import { DatavizLoadingIndicator } from '#V2/Dataviz/components/DatavizLoadingIndicator.js';
import {
  useEntityScopedEntity,
  useMetadataEditing,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useServices } from '#V2/services/index.js';
import { CopyFromSearchView } from './CopyFromSearchView.js';
import { CopyFromSourceHeader, CopyFromSourcePreview } from './CopyFromSourcePreview.js';
import {
  searchCopyFromCandidates,
  useCopyFromSearch,
  type CopyFromSearchCandidates,
} from './useCopyFromSearch.js';
import { useCopyFromSource } from './useCopyFromSource.js';

type CopyFromModalProps = {
  onClose: () => void;
  searchCandidates?: CopyFromSearchCandidates;
};

const CopyFromModal = ({
  onClose,
  searchCandidates = searchCopyFromCandidates,
}: CopyFromModalProps) => {
  const entity = useEntityScopedEntity();
  const templates = useAtomValue(templatesAtom);
  const { form, setIsDirty } = useMetadataEditing();
  const { entities } = useServices();
  const formTemplateId = useWatch({ control: form.control, name: 'template' });
  const currentTemplateId = formTemplateId || entity.template;
  const currentTemplate = templates.find(template => template._id === currentTemplateId);
  const search = useCopyFromSearch({
    currentTemplateId,
    excludeSharedId: entity.sharedId,
    searchCandidates,
  });
  const { source, isLoadingSource, matchingProperties, selectCandidate, stageFields, pickAnother } =
    useCopyFromSource({
      language: entity.language,
      entities,
      form,
      templates,
      currentTemplateId,
      setIsDirty,
      onClose,
    });

  return (
    <Modal size="xl" ariaLabel="Copy from">
      <div className="flex h-[min(80vh,40rem)] flex-col" data-testid="copy-from-modal">
        <Modal.Header>
          {source ? (
            <CopyFromSourceHeader source={source} />
          ) : (
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-ink">
                <Translate>Copy from</Translate>
              </h2>
              <p className="text-xs text-ink-tertiary">
                <Translate>values are staged, not saved</Translate>
              </p>
            </div>
          )}
          <Modal.CloseButton onClick={onClose} />
        </Modal.Header>
        {isLoadingSource ? (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <DatavizLoadingIndicator centered />
          </div>
        ) : null}
        {!isLoadingSource && source ? (
          <CopyFromSourcePreview
            source={source}
            matchingProperties={matchingProperties}
            templateId={currentTemplateId}
            onStage={stageFields}
            onPickAnother={pickAnother}
          />
        ) : null}
        {!isLoadingSource && !source ? (
          <CopyFromSearchView
            query={search.query}
            onQueryChange={search.setQuery}
            sameTypeOnly={search.sameTypeOnly}
            onSameTypeOnlyChange={search.setSameTypeOnly}
            currentTemplate={currentTemplate}
            currentTemplateId={currentTemplateId}
            templates={templates}
            results={search.results}
            isSearching={search.isSearching}
            onSelect={candidate => {
              selectCandidate(candidate).catch(() => undefined);
            }}
          />
        ) : null}
      </div>
    </Modal>
  );
};

export { CopyFromModal };
export type { CopyFromModalProps };
