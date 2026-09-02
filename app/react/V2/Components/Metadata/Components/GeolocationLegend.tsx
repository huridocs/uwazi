import React from 'react';
import { GeolocationMetadataProperty } from '#V2/formatters/types.js';
import { EntityOverlayPill, type OpenEntityTarget } from './EntityOverlayPill.js';

type GeolocationPoint = GeolocationMetadataProperty['values'][number];

const GeolocationLegend = ({
  markers,
  onOpenEntity,
}: {
  markers: GeolocationPoint[];
  onOpenEntity?: (target: OpenEntityTarget) => void;
}) => {
  const labeled = markers.filter(point => point.label);

  if (!labeled.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {labeled.map((point, index) => {
        const relatedId = point.entity?._id;
        const itemKey = `${relatedId ?? 'point'}-${point.value.latitude},${point.value.longitude}-${index}`;
        if (!relatedId) {
          return (
            <EntityOverlayPill
              key={itemKey}
              sharedId=""
              templateId={point.templateId ?? ''}
              label={point.label ?? ''}
              icon={point.entity?.icon}
              authorized={false}
            />
          );
        }
        return (
          <EntityOverlayPill
            key={itemKey}
            sharedId={relatedId}
            templateId={point.templateId ?? ''}
            label={point.label ?? ''}
            icon={point.entity?.icon}
            onOpenEntity={onOpenEntity}
          />
        );
      })}
    </div>
  );
};

export { GeolocationLegend };
