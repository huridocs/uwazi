import React, { useState } from 'react';
import { Cluster } from './Cluster.js';
import { Point } from './Point.js';
import { FileType } from '#V2/api/entities/types.js';
import { EntityReference } from '#V2/formatters/relationships/types.js';
import type { DocumentReferenceGroup } from '../groupReferences.js';

type FullModeProps = {
  document: FileType;
  markerLayerHeight: number;
  onPointClick?: (reference: EntityReference) => void;
  documentClusters?: DocumentReferenceGroup[];
};

const FullMode = ({
  document,
  markerLayerHeight,
  onPointClick,
  documentClusters,
}: FullModeProps) => {
  const [openClusterKey, setOpenClusterKey] = useState<string | null>(null);

  return documentClusters?.map((element, index) => {
    const key = `doc-${element.startPage}-${element.endPage}-${index}`;
    const documentPages = document.totalPages ?? 1;
    const position = (markerLayerHeight / documentPages) * (element.page - 1);
    let positionByPage = position;
    if (element.page === 1) {
      positionByPage += 5;
    } else if (element.page === documentPages) {
      positionByPage -= 5;
    }

    if (element.type === 'cluster') {
      return (
        <Cluster
          key={key}
          position={positionByPage}
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
        position={positionByPage}
        reference={element.references[0]}
        onClick={reference => {
          setOpenClusterKey(null);
          onPointClick?.(reference);
        }}
      />
    );
  });
};

export { FullMode };
