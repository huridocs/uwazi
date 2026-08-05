import React, { useMemo } from 'react';
import { CalendarIcon, DocumentTextIcon, LinkIcon, TagIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { ClientTemplateSchema } from '#V2/shared/types.js';
import {
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import { EntityOverlaySection } from './EntityOverlaySection.js';
import { MetaRow } from './MetaRow.js';

type EntityOverlayMetadataSummaryProps = {
  entity: Entity;
  entityTemplate: ClientTemplateSchema | undefined;
  referenceCount: number;
};

const EntityOverlayMetadataSummary = ({
  entity,
  entityTemplate,
  referenceCount,
}: EntityOverlayMetadataSummaryProps) => {
  const locale = useAtomValue(localeAtom);
  const displayContext = useMemo(() => ({ ...metadataDisplayPresets.compact, locale }), [locale]);
  const created =
    typeof entity.creationDate === 'number'
      ? formatMetadataTimestamp(entity.creationDate, displayContext)
      : '';

  return (
    <EntityOverlaySection title={<Translate>Metadata</Translate>}>
      <MetaRow
        icon={TagIcon}
        label={<Translate>Type</Translate>}
        value={entityTemplate?.name ?? ''}
      />
      <MetaRow icon={DocumentTextIcon} label={<Translate>Title</Translate>} value={entity.title} />
      <MetaRow icon={CalendarIcon} label={<Translate>Created</Translate>} value={created} />
      <MetaRow
        icon={LinkIcon}
        label={<Translate>References</Translate>}
        value={
          <>
            {referenceCount} <Translate>in this document</Translate>
          </>
        }
      />
    </EntityOverlaySection>
  );
};

export { EntityOverlayMetadataSummary };
