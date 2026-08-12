import React, { ReactNode } from 'react';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2 } from '#app/I18N/index.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type { ClientProperty } from '#V2/shared/types.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { CountryFlag } from '../../CustomIcons/index.js';

const DEFAULT_ENTITY_BASE_PATH = '/entityv2/';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type OpenEntityTarget = {
  sharedId: string;
  title: string;
  templateId: string;
};

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  /** Details table only — not Relationships section / leading cards. */
  showExternalLinkIcon?: boolean;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

type ConnectionPillsForFieldOptions = {
  showExternalLinkIcon?: boolean;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelationshipEntityValue => 'title' in value;

const ConnectionPills = ({
  values,
  targetTemplateId,
  showExternalLinkIcon = false,
  onOpenEntity,
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

        const openIcon = showExternalLinkIcon ? (
          <ArrowTopRightOnSquareIcon
            className="h-3 w-3 shrink-0 text-ink-tertiary"
            aria-hidden="true"
            data-testid="connection-external-link-icon"
          />
        ) : null;

        if (onOpenEntity) {
          return (
            <button
              key={itemKey}
              type="button"
              className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-md transition-opacity hover:opacity-80"
              title={value.title}
              onClick={() =>
                onOpenEntity({
                  sharedId: value._id,
                  title: value.title,
                  templateId: value.templateId || targetTemplateId || '',
                })
              }
            >
              {pill}
              {openIcon}
            </button>
          );
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
            {openIcon}
          </I18NLinkV2>
        );
      })}
    </div>
  );
};

const connectionPillsForField = (
  field: RelationshipMetadataProperty,
  templateProperty: ClientProperty | undefined,
  options: ConnectionPillsForFieldOptions = {}
): ReactNode => {
  if (!field.values.every(isEntityRelationshipValue) || field.values.length === 0) {
    return null;
  }
  return (
    <ConnectionPills
      values={field.values}
      targetTemplateId={field.relationShipTarget || templateProperty?.content}
      showExternalLinkIcon={options.showExternalLinkIcon}
      onOpenEntity={options.onOpenEntity}
    />
  );
};

export { ConnectionPills, connectionPillsForField, isEntityRelationshipValue };
export type { ConnectionPillsProps, OpenEntityTarget, RelationshipEntityValue };
