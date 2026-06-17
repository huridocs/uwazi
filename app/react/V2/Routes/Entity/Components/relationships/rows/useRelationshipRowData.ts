import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { directionOf } from '#V2/formatters/relationships/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  useDocumentRelationshipNav,
  useRelationshipsSelectionState,
} from '#V2/Routes/Entity/Components/context/index.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';

const useRelationshipRowData = (
  marker: RelationshipMarker,
  selfSharedId: string,
  relationshipTypeNameProp?: string
) => {
  const rowRef = useRef<HTMLDivElement>(null);
  const { scrollToRelationshipPanel, setScrollToRelationshipPanel } = useDocumentRelationshipNav();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { relationshipsEditMode: editMode } = useRelationshipsSelectionState();
  const { hideTargetPill, hideTemplateName, hideRelationType } = useRelationshipRowVisibility();
  const referenceText = marker.anchor?.text?.trim() ?? '';
  const referencePage = marker.anchor?.selections?.[0]?.page;
  const templateName =
    templates.find(template => template._id === marker.target.templateId)?.name ?? '';
  const relationshipTypeName =
    relationshipTypeNameProp ??
    relationshipTypes.find(type => type._id === marker.view.type)?.name ??
    marker.view.relationshipTypeName ??
    '';
  const direction = directionOf(marker.view, selfSharedId);

  useEffect(() => {
    if (scrollToRelationshipPanel !== marker._id) return;
    rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setScrollToRelationshipPanel(null);
  }, [marker._id, scrollToRelationshipPanel, setScrollToRelationshipPanel]);

  return {
    rowRef,
    marker,
    editMode,
    hideTargetPill,
    hideTemplateName,
    hideRelationType,
    referenceText,
    referencePage,
    templateName,
    relationshipTypeName,
    direction,
  };
};

export { useRelationshipRowData };
