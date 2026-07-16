import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { LinkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { CountryFlag } from '../../CustomIcons/index.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { RelationCaption } from './RelationCaption.js';

const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

type RelationshipProps = MetadataFieldProps & {
  values: RelationshipMetadataProperty['values'];
  relationTypeId?: string;
  targetTemplateId?: string;
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelatedRelationshipMetadataProperty['values'][number] => 'title' in value;

const Relationship = ({
  label,
  translationContext,
  hideLabel,
  values,
  className,
  relationTypeId,
  targetTemplateId,
}: RelationshipProps) => {
  const relationshipTypes = useAtomValue(relationshipTypesAtom);
  const relationLabel = useMemo(() => {
    const typeName = relationshipTypes.find(type => type._id === relationTypeId)?.name;
    return typeName || label;
  }, [label, relationTypeId, relationshipTypes]);

  if (!Array.isArray(values) || !values.length || !values.every(isEntityRelationshipValue)) {
    return null;
  }

  return (
    <MetadataCard className={className ?? COMPACT_METADATA_FIELD_LAYOUT}>
      <div className="flex items-center gap-1.5">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-carbon" aria-hidden="true" />
        <dt>
          <Translate
            className={hideLabel ? 'sr-only' : 'text-sm font-bold leading-tight text-ink'}
            context={translationContext}
          >
            {label}
          </Translate>
        </dt>
      </div>
      <RelationCaption relationLabel={relationLabel} />
      <dd className="mt-1 flex flex-wrap gap-1.5">
        {values.map((value, index) => {
          const itemKey = value._id || `${label}-${index}`;
          const pill = (
            <span className="inline-flex max-w-full items-center gap-1.5">
              {value.icon?._id && <CountryFlag id={value.icon._id} />}
              <TemplatePill
                templateId={value.templateId || targetTemplateId || ''}
                label={value.title}
              />
            </span>
          );

          if (value.authorized === false) {
            return <span key={itemKey}>{pill}</span>;
          }

          return (
            <I18NLinkV2
              key={itemKey}
              className="max-w-full rounded-md transition-opacity hover:opacity-80"
              to={`${DEFAULT_ENTITY_BASE_PATH}${value._id}`}
              target="_blank"
              rel="noreferrer"
              localized={false}
              title={value.title}
            >
              {pill}
            </I18NLinkV2>
          );
        })}
      </dd>
    </MetadataCard>
  );
};

export { Relationship };
