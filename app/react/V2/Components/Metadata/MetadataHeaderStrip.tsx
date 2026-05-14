import React from 'react';
import { Entity } from '#V2/api/entities/types.js';
import { MetadataEntityHeader } from './MetadataEntityHeader.js';

const HEADER_SHELL_CLASS =
  'sticky top-0 z-20 -mx-(--spacing-theme-4) mb-(--spacing-theme-2) border-b border-[color-mix(in_srgb,var(--color-theme-border-default)_55%,transparent)] bg-(--color-theme-surface-raised) px-(--spacing-theme-4) pb-(--spacing-theme-3) pt-(--spacing-theme-2)';

type MetadataHeaderStripProps = {
  entity: Entity;
  headerLayout?: 'inline' | 'stacked';
};

const MetadataHeaderStrip = ({ entity, headerLayout = 'inline' }: MetadataHeaderStripProps) => (
  <div className={HEADER_SHELL_CLASS}>
    <MetadataEntityHeader
      templateId={entity.template}
      title={entity.title}
      iconId={entity.icon?._id}
      layout={headerLayout}
    />
  </div>
);

export { MetadataHeaderStrip };
