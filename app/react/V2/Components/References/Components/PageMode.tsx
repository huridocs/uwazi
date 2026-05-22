import React, { useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { ReferenceGroup } from '../groupReferences.js';

type PageModeProps = {
  markerLayerHeight: number;
  onPointClick?: (reference: EntityReference) => void;
  pageClusters?: ReferenceGroup[];
};

const PageMode = ({ markerLayerHeight, onPointClick, pageClusters }: PageModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);

  return pageClusters?.map((element, index) => {
    const key = `page-${element.page}-${element.top}-${index}`;

    if (element.type === 'cluster') {
      return (
        <Cluster
          key={key}
          position={element.top / markerLayerHeight}
          references={element.references}
          isOpen={openClusterKey === key}
          onToggle={() => {
            setOpenClusterKey(currentValue => (currentValue === key ? null : key));
          }}
          onPointClick={reference => {
            onPointClick?.(reference);
          }}
        />
      );
    }

    return (
      <Point
        key={key}
        position={element.top / markerLayerHeight}
        reference={element.reference}
        onClick={reference => {
          setOpenClusterKey(null);
          onPointClick?.(reference);
        }}
      />
    );
  });
};

export { PageMode };
