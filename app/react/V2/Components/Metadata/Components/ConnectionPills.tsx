import React, { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';
import { I18NLinkV2 } from '#app/I18N/index.js';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import type { ClientProperty } from '#V2/shared/types.js';
import {
  RelationshipMetadataProperty,
  RelatedRelationshipMetadataProperty,
} from '#V2/formatters/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { CountryFlag } from '../../CustomIcons/index.js';
type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  /** Details table only — not Relationships section / leading cards. */
  showExternalLinkIcon?: boolean;
};

type ConnectionPillsForFieldOptions = {
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
  const settings = useAtomValue(settingsAtom);
  const entityBasePath = `${getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features))}/`;

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
            to={`${entityBasePath}${value._id}`}
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
    />
  );
};

export { ConnectionPills, connectionPillsForField, isEntityRelationshipValue };
export type { ConnectionPillsProps, RelationshipEntityValue };
