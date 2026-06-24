/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipRowData, relationshipReferenceDisplay } from './useRelationshipRowData.js';
import {
  RelationshipRowCompact,
  RelationshipRowDetail,
  RelationshipRowOverview,
} from './RelationshipRowVariants.js';

type RelationshipRowProps = {
  marker: RelationshipMarker;
  selfSharedId: string;
  relationshipTypeName?: string;
  isSelected?: boolean;
  nested?: boolean;
  representedIds?: string[];
  representedCount?: number;
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const RelationshipRow = ({
  marker,
  selfSharedId,
  relationshipTypeName,
  isSelected,
  nested = false,
  representedIds,
  representedCount,
  onClick,
  onView,
  onDelete,
}: RelationshipRowProps) => {
  const { zoom } = useRelationshipsPanelLayout();
  const ids = React.useMemo(() => representedIds ?? [marker._id], [marker._id, representedIds]);
  const rowData = useRelationshipRowData(marker, selfSharedId, relationshipTypeName, ids);
  const nestedReference = relationshipReferenceDisplay(marker, selfSharedId);
  const baseProps = {
    ...rowData,
    referenceText: nested ? nestedReference.referenceText : rowData.referenceText,
    referencePage: nested ? nestedReference.referencePage : rowData.referencePage,
    isSelected,
    representedIds: ids,
    representedCount,
    onClick,
  };

  if (nested) {
    if (zoom === 'overview') {
      return <RelationshipRowOverview {...baseProps} />;
    }
    return <RelationshipRowDetail {...baseProps} nested onView={onView} onDelete={onDelete} />;
  }

  if (zoom === 'overview') return <RelationshipRowOverview {...baseProps} />;
  if (zoom === 'compact') return <RelationshipRowCompact {...baseProps} />;
  return <RelationshipRowDetail {...baseProps} onView={onView} onDelete={onDelete} />;
};

export { RelationshipRow };
