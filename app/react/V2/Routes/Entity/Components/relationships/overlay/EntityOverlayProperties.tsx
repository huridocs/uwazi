import React from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { renderFieldContent } from '#V2/Components/Metadata/Components/metadataFieldContent.js';
import { EntityOverlaySection } from './EntityOverlaySection.js';
import { MetaRow } from './MetaRow.js';

type EntityOverlayPropertiesProps = {
  metadata: MetadataProperty[];
  translationContext: string;
};

const isFullWidthProperty = (property: MetadataProperty) =>
  ['image', 'preview', 'media', 'geolocation'].includes(property.type);

const EntityOverlayProperties = ({
  metadata,
  translationContext,
}: EntityOverlayPropertiesProps) => {
  if (metadata.length === 0) {
    return null;
  }

  return (
    <EntityOverlaySection title={<Translate>Properties</Translate>}>
      {metadata.map(property => (
        <MetaRow
          key={property._id}
          icon={TagIcon}
          label={<Translate context={translationContext}>{property.label}</Translate>}
          value={renderFieldContent(property, { density: 'compact' })}
          valueLayout={isFullWidthProperty(property) ? 'full' : 'inline'}
        />
      ))}
    </EntityOverlaySection>
  );
};

export { EntityOverlayProperties };
