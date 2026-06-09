import React from 'react';
import { Entity } from '#V2/api/entities/types.js';
import { MetadataEntityHeader } from './MetadataEntityHeader.js';

const METADATA_HEADER_STRIP_BASE =
  '-mx-4 mb-2 border-b border-[color-mix(in_srgb,var(--color-theme-border-default)_55%,transparent)] bg-(--color-theme-surface-raised) px-4 pb-3 pt-2';

const metadataHeaderStripShellClass = (sticky: boolean) =>
  sticky ? `sticky top-0 z-20 ${METADATA_HEADER_STRIP_BASE}` : METADATA_HEADER_STRIP_BASE;

type MetadataHeaderStripProps = {
  entity: Entity;
  headerLayout?: 'inline' | 'stacked';
};

const MetadataHeaderStrip = ({ entity, headerLayout = 'inline' }: MetadataHeaderStripProps) => (
  <div className={metadataHeaderStripShellClass(headerLayout !== 'stacked')}>
    <MetadataEntityHeader
      templateId={entity.template}
      title={entity.title}
      iconId={entity.icon?._id}
      layout={headerLayout}
    />
  </div>
);

export { MetadataHeaderStrip, metadataHeaderStripShellClass };
