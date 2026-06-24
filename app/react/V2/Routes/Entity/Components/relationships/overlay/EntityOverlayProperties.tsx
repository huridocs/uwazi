import React, { useMemo } from 'react';
import { TagIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import {
  formatMetadataDisplayValue,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import { EntityOverlaySection } from './EntityOverlaySection.js';
import { MetaRow } from './MetaRow.js';

type EntityOverlayPropertiesProps = {
  metadata: MetadataProperty[];
  translationContext: string;
};

const EntityOverlayProperties = ({
  metadata,
  translationContext,
}: EntityOverlayPropertiesProps) => {
  const locale = useAtomValue(localeAtom);
  const displayContext = useMemo(() => ({ ...metadataDisplayPresets.compact, locale }), [locale]);

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
          value={formatMetadataDisplayValue(property, displayContext)}
        />
      ))}
    </EntityOverlaySection>
  );
};

export { EntityOverlayProperties };
