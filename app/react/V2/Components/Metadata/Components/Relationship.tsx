import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { ArrowTopRightOnSquareIcon, LinkIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2, Translate } from '#app/I18N/index.js';
import { relationshipTypesAtom } from '#V2/atoms/relationshipTypes.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { CountryFlag } from '../../CustomIcons/index.js';
import { MetadataCard } from './MetadataCard.js';
import { RelationCaption } from './RelationCaption.js';

const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  /** Details table only — not Relationships section / leading cards. */
  showExternalLinkIcon?: boolean;
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelationshipEntityValue => 'title' in value;

const ConnectionPills = ({
  values,
  targetTemplateId,
  showExternalLinkIcon = false,
}: ConnectionPillsProps) => {
  if (!values.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((value, index) => {
        const itemKey = value._id || `rel-${index}`;
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
            className="inline-flex max-w-full items-center gap-1 rounded-md transition-opacity hover:opacity-80"
            to={`${DEFAULT_ENTITY_BASE_PATH}${value._id}`}
            target="_blank"
            rel="noreferrer"
            localized={false}
            title={value.title}
          >
            {pill}
            {showExternalLinkIcon ? (
              <ArrowTopRightOnSquareIcon
                className="h-3 w-3 shrink-0 text-ink-tertiary"
                aria-hidden="true"
                data-testid="connection-external-link-icon"
              />
            ) : null}
          </I18NLinkV2>
        );
      })}
    </div>
  );
};

type RelationshipProps = {
  label: string;
  translationContext: string;
  hideLabel?: boolean;
  className?: string;
  values: RelationshipMetadataProperty['values'];
  relationTypeId?: string;
  targetTemplateId?: string;
  inheritLabel?: string;
};

const Relationship = ({
  label,
  translationContext,
  hideLabel,
  className,
  values,
  relationTypeId,
  targetTemplateId,
  inheritLabel,
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
    <MetadataCard className={className}>
      <dt className="flex items-center gap-1.5">
        <LinkIcon className="h-3.5 w-3.5 shrink-0 text-carbon" aria-hidden="true" />
        <Translate
          className={hideLabel ? 'sr-only' : 'text-sm font-bold leading-tight text-ink'}
          context={translationContext}
        >
          {label}
        </Translate>
      </dt>
      <dd className="mt-1 flex flex-col gap-1.5">
        <RelationCaption relationLabel={relationLabel} inheritLabel={inheritLabel} />
        <ConnectionPills values={values} targetTemplateId={targetTemplateId} />
      </dd>
    </MetadataCard>
  );
};

export { Relationship, ConnectionPills, isEntityRelationshipValue };
