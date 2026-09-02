import React from 'react';
import { useAtomValue } from 'jotai';
import { I18NLinkV2 } from '#app/I18N/index.js';
import {
  getEntityViewerV2BasePath,
  isEntityViewerV2Enabled,
} from '#app/utils/entityViewerPaths.js';
import { GeolocationMetadataProperty } from '#V2/formatters/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { TemplatePill } from '#V2/Components/UI/TemplatePill.js';
import { EntityIcon } from '../../CustomIcons/index.js';
import type { OpenEntityTarget } from './ConnectionPills.js';

type GeolocationPoint = GeolocationMetadataProperty['values'][number];

const GeolocationLegend = ({
  markers,
  onOpenEntity,
}: {
  markers: GeolocationPoint[];
  onOpenEntity?: (target: OpenEntityTarget) => void;
}) => {
  const settings = useAtomValue(settingsAtom);
  const entityBasePath = `${getEntityViewerV2BasePath(isEntityViewerV2Enabled(settings.features))}/`;
  const labeled = markers.filter(point => point.label);

  if (!labeled.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labeled.map((point, index) => {
        const templateId = point.templateId ?? '';
        const relatedId = point.entity?._id;
        const pill = (
          <span className="inline-flex max-w-full items-center gap-1.5">
            {point.entity?.icon ? <EntityIcon data={point.entity.icon} /> : null}
            <TemplatePill templateId={templateId} label={point.label} />
          </span>
        );
        const itemKey = `${relatedId ?? 'point'}-${point.value.latitude},${point.value.longitude}-${index}`;

        if (!relatedId) {
          return <span key={itemKey}>{pill}</span>;
        }

        if (onOpenEntity) {
          return (
            <button
              key={itemKey}
              type="button"
              className="inline-flex max-w-full cursor-pointer items-center gap-1 rounded-md transition-opacity hover:opacity-80"
              title={point.label}
              onClick={() =>
                onOpenEntity({
                  sharedId: relatedId,
                  title: point.label ?? '',
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
            to={`${entityBasePath}${relatedId}`}
            target="_blank"
            rel="noreferrer"
            localized={false}
            title={point.label}
          >
            {pill}
          </I18NLinkV2>
        );
      })}
    </div>
  );
};

export { GeolocationLegend };
