import React from 'react';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { librarySelectionActions } from './librarySelectionActions.js';
import type { LibraryBulkAction, LibrarySelectionAction } from './librarySelectionActions.js';
import { LibrarySelectionBarButton } from './librarySelectionBarButton.js';
import type { BarTone } from './librarySelectionBarButton.js';
import { editorRoles } from './libraryResultsFooterActions.js';

const actionTone = (action: LibrarySelectionAction): BarTone => {
  if (action.id === 'edit') {
    return 'lead';
  }
  if (action.danger) {
    return 'danger';
  }
  return 'ghost';
};

type LibrarySelectionLeadActionsProps = {
  onAction?: (action: LibraryBulkAction) => void;
};

const LibrarySelectionLeadActions = ({ onAction }: LibrarySelectionLeadActionsProps) => {
  const lead = librarySelectionActions().filter(
    action => action.id === 'edit' || action.id === 'export'
  );
  return lead.map(action => {
    const button = (
      <LibrarySelectionBarButton
        key={action.id}
        icon={action.icon}
        label={action.label}
        tone={actionTone(action)}
        onClick={() => onAction?.(action.id)}
      />
    );
    if (action.id === 'export') {
      return button;
    }
    return (
      <NeedAuthorization key={action.id} roles={editorRoles}>
        {button}
      </NeedAuthorization>
    );
  });
};

export { LibrarySelectionLeadActions };
