import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { MetadataCard, TemplateLabel, Title } from './Components/index.js';

type MetadataHeaderStripProps = {
  entity: Entity;
};

const MetadataHeaderStrip = ({ entity }: MetadataHeaderStripProps) => (
  <div className="sticky top-0 z-20 -mx-(--spacing-theme-4) mb-(--spacing-theme-2) border-b border-[color-mix(in_srgb,var(--color-theme-border-default)_55%,transparent)] bg-(--color-theme-surface-raised) px-(--spacing-theme-4) pb-(--spacing-theme-3) pt-(--spacing-theme-2)">
    <MetadataCard className="bg-(--color-theme-surface-warm) flex flex-row! flex-wrap items-center gap-(--spacing-theme-2)">
      <span className="sr-only">
        <Translate>Template</Translate>
      </span>
      <TemplateLabel templateId={entity.template} />
      <dl className="m-0 min-w-0 flex-1">
        <Title
          label="Title"
          title={entity.title}
          iconId={entity.icon?._id}
          translationContext={entity.template}
        />
      </dl>
    </MetadataCard>
  </div>
);

export { MetadataHeaderStrip };
