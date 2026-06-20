import { useEffect, useRef } from 'react';
import { useAtomValue } from 'jotai';
import type { ClientRelationshipType, Template } from '#app/apiResponseTypes.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { directionOf, counterpartAnchorOf } from '#V2/formatters/relationships/types.js';
import type { RelationshipMarker } from '#V2/Components/Relationships/types.js';
import {
  useDocumentRelationshipNav,
  useRelationshipsSelectionState,
} from '#V2/Routes/Entity/Components/context/index.js';
import { scrollIntoView } from '#V2/helpers/scrollIntoView.js';
import { useRelationshipRowVisibility } from '../hooks/useRelationshipRowVisibility.js';

const relationshipReferenceDisplay = (
  marker: RelationshipMarker,
  selfSharedId: string
): { referenceText: string; referencePage: number | undefined } => {
  const counterpartAnchor = counterpartAnchorOf(marker.view, selfSharedId);
  const counterpartText = counterpartAnchor?.text?.trim() ?? '';
  const selfText = marker.anchor?.text?.trim() ?? '';
  const referenceText = counterpartText || selfText;
  const referencePage = counterpartText ? undefined : marker.anchor?.selections?.[0]?.page;
  return { referenceText, referencePage };
};

type BuildRelationshipRowDerivedDataParams = {
  marker: RelationshipMarker;
  selfSharedId: string;
  relationshipTypes: ClientRelationshipType[];
  templates: Template[];
  relationshipTypeNameProp?: string;
};

const buildRelationshipRowDerivedData = ({
  marker,
  selfSharedId,
  relationshipTypes,
  templates,
  relationshipTypeNameProp,
}: BuildRelationshipRowDerivedDataParams) => {
  const { referenceText, referencePage } = relationshipReferenceDisplay(marker, selfSharedId);
  const templateName =
    templates.find(template => template._id === marker.target.templateId)?.name ?? '';
  const relationshipTypeName =
    relationshipTypeNameProp ??
    relationshipTypes.find(type => type._id === marker.view.type)?.name ??
    marker.view.relationshipTypeName ??
    '';

  return {
    referenceText,
    referencePage,
    templateName,
    relationshipTypeName,
    direction: directionOf(marker.view, selfSharedId),
  };
};

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
  const derived = buildRelationshipRowDerivedData({
    marker,
    selfSharedId,
    relationshipTypes,
    templates,
    relationshipTypeNameProp,
  });

  useEffect(() => {
    if (scrollToRelationshipPanel !== marker._id) return;
    scrollIntoView(rowRef.current, { behavior: 'smooth', block: 'center' });
    setScrollToRelationshipPanel(null);
  }, [marker._id, scrollToRelationshipPanel, setScrollToRelationshipPanel]);

  return {
    rowRef,
    marker,
    editMode,
    hideTargetPill,
    hideTemplateName,
    hideRelationType,
    ...derived,
  };
};

export { useRelationshipRowData, relationshipReferenceDisplay };
