/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import { counterpartAnchorOf } from '#V2/formatters/relationships/types.js';
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
  nested?: boolean;
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
  onClick,
  onView,
  onDelete,
}: RelationshipRowProps) => {
  const { zoom } = useRelationshipsPanelLayout();
  const rowData = useRelationshipRowData(marker, selfSharedId, relationshipTypeName);
  const counterpartText = counterpartAnchorOf(marker.view, selfSharedId)?.text?.trim() ?? '';
  const sourceText = marker.anchor?.text?.trim() ?? '';
  const baseProps = {
    ...rowData,
    referenceText: nested ? counterpartText || sourceText : rowData.referenceText,
    referencePage: nested ? marker.anchor?.selections?.[0]?.page : rowData.referencePage,
    isSelected,
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
