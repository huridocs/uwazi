import React from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';
import { FacetSection } from '#V2/Components/UI/FacetSection.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import {
  useRelationshipsPanelData,
  useRelationshipsPanelFilters,
} from '#V2/Routes/Entity/Components/context/index.js';

const RelationshipsFilterDrawerContent = () => {
  const { relTypeFilters, setRelTypeFilters, entityTypeFilters, setEntityTypeFilters } =
    useRelationshipsPanelFilters();
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { facetCounts } = useRelationshipsPanelData();
  const { byRelType, byEntityType, total } = facetCounts;

  const relTypeName = (id: string) => relationshipTypes.find(type => type._id === id)?.name ?? id;
  const templateName = (id: string) => templates.find(template => template._id === id)?.name ?? id;
  const templateColor = (id: string) => templates.find(template => template._id === id)?.color;

  return (
    <>
      <FacetSection
        title={<Translate>Relation type</Translate>}
        total={total}
        entries={byRelType}
        selected={relTypeFilters}
        onToggle={id => setRelTypeFilters(current => ({ ...current, [id]: !current[id] }))}
        label={relTypeName}
        noLabelId="no_label"
        defaultExpanded
      />
      <FacetSection
        title={<Translate>Target entity type</Translate>}
        total={total}
        entries={byEntityType}
        selected={entityTypeFilters}
        onToggle={id => setEntityTypeFilters(current => ({ ...current, [id]: !current[id] }))}
        label={templateName}
        noLabelId="unknown"
        renderMarker={id => {
          const color = templateColor(id);
          return color ? <ColorDot color={color} /> : null;
        }}
      />
    </>
  );
};

export { RelationshipsFilterDrawerContent };
