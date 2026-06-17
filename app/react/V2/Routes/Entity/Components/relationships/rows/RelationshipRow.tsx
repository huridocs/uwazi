import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { useRelationshipsPanelLayout } from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipRowData } from './useRelationshipRowData.js';
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
  onClick?: () => void;
  onView?: () => void;
  onDelete?: () => void;
};

const RelationshipRow = ({
  marker,
  selfSharedId,
  relationshipTypeName,
  isSelected,
  onClick,
  onView,
  onDelete,
}: RelationshipRowProps) => {
  const { zoom } = useRelationshipsPanelLayout();
  const rowData = useRelationshipRowData(marker, selfSharedId, relationshipTypeName);
  const baseProps = { ...rowData, isSelected, onClick };

  if (zoom === 'overview') return <RelationshipRowOverview {...baseProps} />;
  if (zoom === 'compact') return <RelationshipRowCompact {...baseProps} />;
  return <RelationshipRowDetail {...baseProps} onView={onView} onDelete={onDelete} />;
};

export { RelationshipRow };
