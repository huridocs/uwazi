import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { useAnimateToPosition } from '../hooks/useAnimateToPosition.js';
import { RelationshipMarker } from '../types.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { PortalTooltip } from '#V2/Components/UI/index.js';
import { Translate } from '#app/I18N/index.js';
import { RAIL_MARKER_ACTIVE_SIZE, RAIL_MARKER_SIZE, railMarkerZIndex } from '../markerMetrics.js';

type PointProps = {
  position: number;
  stackOrder?: number;
  marker: RelationshipMarker;
  onClick: (marker: RelationshipMarker) => void;
  isActive?: boolean;
  representedCount?: number;
};

const activeMarkerShadow = (color: string): string =>
  `0 0 0 2px var(--color-theme-surface-raised), 0 0 0 4.5px ${color}99`;

const Point = ({
  position,
  stackOrder = 1,
  marker,
  onClick,
  isActive = false,
  representedCount = 1,
}: PointProps) => {
  const animatedPosition = useAnimateToPosition(position);
  const templates = useAtomValue(templatesAtom);
  const targetTemplate = useMemo(
    () => templates.find(template => template._id === marker.target.templateId),
    [marker, templates]
  );
  const color = targetTemplate?.color || '#000000';
  const dotSize = isActive ? RAIL_MARKER_ACTIVE_SIZE : RAIL_MARKER_SIZE;

  return (
    <button
      type="button"
      data-testid="rail-marker"
      data-marker-id={marker._id}
      data-stack-order={stackOrder}
      className="pointer-events-auto absolute cursor-pointer [transition-property:top] duration-500 ease-out"
      style={{
        top: `${animatedPosition}px`,
        zIndex: railMarkerZIndex(stackOrder, isActive ? 'point-active' : 'point'),
      }}
      onClick={() => {
        onClick(marker);
      }}
    >
      <span no-translate="true" className="sr-only">
        {marker.target.title}
      </span>
      <PortalTooltip content={marker.target.title} placement="left">
        <span
          className="flex items-center justify-center"
          style={{ width: RAIL_MARKER_SIZE, height: RAIL_MARKER_SIZE }}
        >
          <span
            data-testid="rail-marker-dot"
            className={`block shrink-0 rounded-full transition-[opacity,box-shadow,transform] duration-150 ease-out ${
              isActive ? '' : 'hover:scale-125'
            }`}
            style={{
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              opacity: isActive ? 1 : 0.7,
              boxShadow: isActive ? activeMarkerShadow(color) : 'none',
            }}
          />
          {representedCount > 1 && (
            <span className="absolute left-2 top-1/2 rounded bg-parchment px-0.5 text-[8px] font-semibold leading-3 text-ink-tertiary">
              <Translate>x</Translate>
              {representedCount}
            </span>
          )}
        </span>
      </PortalTooltip>
    </button>
  );
};

export { Point };
