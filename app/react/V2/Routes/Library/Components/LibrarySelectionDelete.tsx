import React from 'react';
import { NeedAuthorization } from '#V2/Components/UI/NeedAuthorization.js';
import { LibraryFooterDivider } from './LibraryFooterDivider.js';
import {
  bulkDeleteLimitTitle,
  deleteExceedsBulkLimit,
  librarySelectionActions,
} from './librarySelectionActions.js';
import type { LibraryBulkAction } from './librarySelectionActions.js';
import { LibrarySelectionBarButton } from './librarySelectionBarButton.js';
import { editorRoles } from './libraryResultsFooterActions.js';

type LibrarySelectionDeleteProps = {
  count: number;
  onAction?: (action: LibraryBulkAction) => void;
};

const LibrarySelectionDelete = ({ count, onAction }: LibrarySelectionDeleteProps) => {
  const action = librarySelectionActions().find(item => item.id === 'delete');
  const disabled = deleteExceedsBulkLimit(count);
  if (!action) {
    return null;
  }
  return (
    <NeedAuthorization roles={editorRoles}>
      <LibraryFooterDivider />
      <LibrarySelectionBarButton
        icon={action.icon}
        label={action.label}
        tone="danger"
        disabled={disabled}
        title={disabled ? bulkDeleteLimitTitle() : undefined}
        onClick={() => onAction?.(action.id)}
      />
    </NeedAuthorization>
  );
};

export { LibrarySelectionDelete };
