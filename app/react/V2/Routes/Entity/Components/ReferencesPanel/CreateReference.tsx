import React from 'react';
import { TextSelection } from '@huridocs/react-text-selection-handler';
import { Translate } from '#app/I18N/index.js';
import { Panel } from '#V2/Components/Layouts/Panel.js';
import { ClientRelationshipType } from '#app/apiResponseTypes.js';
import { Button } from '#V2/Components/UI/Button.js';
import { ReferenceMode } from './referencesAtom.js';
import { useCreateReferenceState } from './useCreateReferenceState.js';
import { SelectTargetStep } from './SelectTargetStep.js';
import { SelectTextInTargetStep } from './SelectTextInTargetStep.js';

type SearchFunction = (searchString: string) => Promise<import('#V2/domain').Entity[]>;

type CreateReferenceProps = {
  selection: TextSelection;
  relationshipTypes: ClientRelationshipType[];
  searchFunction: SearchFunction;
  mode?: ReferenceMode;
  onSave?: (data: {
    selection: TextSelection;
    targetEntityId: string;
    relationshipType: string;
    targetFileId?: string;
    targetSelection?: TextSelection;
  }) => void;
  onCancel?: () => void;
};

const CreateReference = ({
  selection,
  relationshipTypes,
  searchFunction,
  mode = 'text',
  onSave,
  onCancel,
}: CreateReferenceProps) => {
  const state = useCreateReferenceState({ selection, searchFunction, mode, onSave });

  return (
    <Panel className="gap-4">
      <Panel.Body className="pt-2 flex flex-col min-h-0">
        {state.step === 'selectTarget' ? (
          <SelectTargetStep
            relationshipTypes={relationshipTypes}
            selectedRelationshipType={state.selectedRelationshipType}
            searchQuery={state.searchQuery}
            searchResults={state.searchResults}
            isSearching={state.isSearching}
            hasSearched={state.hasSearched}
            selectedEntity={state.selectedEntity}
            selectedFile={state.selectedFile}
            mode={mode}
            onRelationshipTypeToggle={state.handleRelationshipTypeToggle}
            onSearchInputChange={state.handleSearchInputChange}
            onClearSearch={state.handleClearSearch}
            onEntitySelect={state.handleEntitySelect}
            onFileSelect={state.handleFileSelect}
          />
        ) : (
          <SelectTextInTargetStep
            selectedEntity={state.selectedEntity}
            selectedFile={state.selectedFile}
            onTargetPdfSelect={state.handleTargetPdfSelect}
            onTargetPdfDeselect={state.handleTargetPdfDeselect}
          />
        )}
      </Panel.Body>

      <Panel.Footer>
        <div className="flex justify-end w-full gap-2">
          {state.step === 'selectTextInTarget' && (
            <Button variant="secondary" onClick={state.handleBack}>
              <Translate>Back</Translate>
            </Button>
          )}
          <Button variant="secondary" onClick={onCancel}>
            <Translate>Cancel</Translate>
          </Button>
          {state.showContinueButton && (
            <Button variant="primary" onClick={state.handleContinue} disabled={!state.canContinue}>
              <Translate>Continue</Translate>
            </Button>
          )}
          {state.showSaveButton && (
            <Button
              variant="success"
              onClick={state.handleSave}
              disabled={
                !state.selectedRelationshipType ||
                !state.selectedEntity ||
                (mode === 'text' && !state.selectedFile) ||
                (state.step === 'selectTextInTarget' && !state.targetSelection)
              }
            >
              <Translate>Save</Translate>
            </Button>
          )}
        </div>
      </Panel.Footer>
    </Panel>
  );
};

export { CreateReference };
