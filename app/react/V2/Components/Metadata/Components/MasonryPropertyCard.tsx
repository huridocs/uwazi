import React, { PropsWithChildren, ReactNode } from 'react';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataCard } from './MetadataCard.js';
import { COMPACT_METADATA_FIELD_LAYOUT } from '../metadataPropertyLayout.js';

type MasonryPropertyCardProps = PropsWithChildren<{
  label: string;
  translationContext: string;
  hideLabel?: boolean;
  className?: string;
  labelNode?: ReactNode;
}>;

const MasonryPropertyCard = ({
  label,
  translationContext,
  hideLabel,
  className,
  labelNode,
  children,
}: MasonryPropertyCardProps) => (
  <MetadataCard className={className ?? COMPACT_METADATA_FIELD_LAYOUT}>
    <dt>
      {labelNode ?? (
        <PropertyLabel
          label={label}
          translationContext={translationContext}
          hideLabel={hideLabel}
        />
      )}
    </dt>
    {children}
  </MetadataCard>
);

export { MasonryPropertyCard };
