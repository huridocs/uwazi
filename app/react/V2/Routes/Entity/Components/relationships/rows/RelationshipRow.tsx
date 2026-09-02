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
  onDelete?: () => void;
};

const renderZoomRow = ({
  zoom,
  nested,
  baseProps,
  onDelete,
}: {
  zoom: ReturnType<typeof useRelationshipsPanelLayout>['zoom'];
  nested: boolean;
  baseProps: Parameters<typeof RelationshipRowOverview>[0] & { representedCount?: number };
  onDelete?: () => void;
}) => {
  if (nested && zoom !== 'overview') {
    return <RelationshipRowDetail {...baseProps} nested onDelete={onDelete} />;
  }
  if (zoom === 'overview') return <RelationshipRowOverview {...baseProps} />;
  if (zoom === 'compact' && !nested) return <RelationshipRowCompact {...baseProps} />;
  return <RelationshipRowDetail {...baseProps} onDelete={onDelete} />;
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
  onDelete,
}: RelationshipRowProps) => {
  const { zoom } = useRelationshipsPanelLayout();
  const ids = React.useMemo(() => representedIds ?? [marker._id], [marker._id, representedIds]);
  const rowData = useRelationshipRowData(marker, selfSharedId, relationshipTypeName, ids);
  const nestedReference = relationshipReferenceDisplay(marker, selfSharedId);
  return renderZoomRow({
    zoom,
    nested,
    baseProps: {
      ...rowData,
      referenceText: nested ? nestedReference.referenceText : rowData.referenceText,
      referencePage: nested ? nestedReference.referencePage : rowData.referencePage,
      isSelected,
      representedIds: ids,
      representedCount,
      onClick,
    },
    onDelete,
  });
};

export { RelationshipRow };
