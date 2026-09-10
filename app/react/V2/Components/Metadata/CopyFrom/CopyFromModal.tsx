import React from 'react';
import { useAtomValue } from 'jotai';
import { useWatch } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { Modal } from '#V2/Components/UI/index.js';
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
    <Modal size="md" ariaLabel="Copy from">
      <div className="flex max-h-[min(80vh,40rem)] min-h-80 flex-col" data-testid="copy-from-modal">
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
          <p className="px-5 py-8 text-center text-sm text-ink-secondary">
            <Translate>Loading</Translate>
          </p>
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
