import React, { ReactNode } from 'react';
import { useAtomValue } from 'jotai';
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
import { EntityIcon } from '../../CustomIcons/index.js';

type RelationshipEntityValue = RelatedRelationshipMetadataProperty['values'][number];

type OpenEntityTarget = {
  sharedId: string;
  title: string;
  templateId: string;
};

type ConnectionPillsProps = {
  values: RelationshipEntityValue[];
  targetTemplateId?: string;
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

type ConnectionPillsForFieldOptions = {
  onOpenEntity?: (target: OpenEntityTarget) => void;
};

const isEntityRelationshipValue = (
  value: RelationshipMetadataProperty['values'][number]
): value is RelationshipEntityValue => 'title' in value;

const ConnectionPills = ({ values, targetTemplateId, onOpenEntity }: ConnectionPillsProps) => {
  const settings = useAtomValue(settingsAtom);
  const entityBasePath = `${getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features))}/`;

  if (!values.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {values.map((value, index) => {
        const itemKey = value._id || `rel-${index}`;
        const templateId = value.templateId || targetTemplateId || '';
        const pill = (
          <span className="inline-flex max-w-full items-center gap-1.5">
            {value.icon ? <EntityIcon data={value.icon} /> : null}
            <TemplatePill templateId={templateId} label={value.title} />
          </span>
        );

        if (value.authorized === false) {
          return <span key={itemKey}>{pill}</span>;
        }

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
                  templateId,
                })
              }
            >
              {pill}
            </button>
          );
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
      onOpenEntity={options.onOpenEntity}
    />
  );
};

export { ConnectionPills, connectionPillsForField, isEntityRelationshipValue };
export type { ConnectionPillsProps, OpenEntityTarget, RelationshipEntityValue };
