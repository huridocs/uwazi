import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { FacetSection } from '#V2/Components/UI/FacetSection.js';
import { relationshipTypesAtom, templatesAtom } from '#V2/atoms/index.js';
import { relationshipsPanelFacetCountsAtom } from './relationshipsPanelDataAtoms.js';
import {
  relationshipsPanelEntityTypeFiltersAtom,
  relationshipsPanelRelTypeFiltersAtom,
} from './relationshipsPanelFiltersAtom.js';

const RelationshipsFilterDrawerContent = () => {
  const [relTypeFilters, setRelTypeFilters] = useAtom(relationshipsPanelRelTypeFiltersAtom);
  const [entityTypeFilters, setEntityTypeFilters] = useAtom(
    relationshipsPanelEntityTypeFiltersAtom
  );
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const templates = useAtomValue(templatesAtom);
  const { byRelType, byEntityType, total } = useAtomValue(relationshipsPanelFacetCountsAtom);

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
          return color ? (
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
              style={{ backgroundColor: color }}
            />
          ) : null;
        }}
      />
    </>
  );
};

export { RelationshipsFilterDrawerContent };
