import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { MetadataCard, TemplateLabel, Title } from './Components/index.js';

type MetadataEntityHeaderProps = {
  templateId: string;
  title: string;
  iconId?: string;
  layout: 'inline' | 'stacked';
  trailing?: ReactNode;
};

const MetadataEntityHeader = ({
  templateId,
  title,
  iconId,
  layout,
  trailing,
}: MetadataEntityHeaderProps) => {
  const isStacked = layout === 'stacked';
  const cardClassName = isStacked
    ? 'bg-(--color-theme-surface-warm) flex flex-col items-start gap-2'
    : 'bg-(--color-theme-surface-warm) flex flex-row! flex-wrap items-center gap-2';
  const dlClassName = isStacked ? 'm-0 min-w-0 w-full' : 'm-0 min-w-0 flex-1';

  return (
    <MetadataCard className={cardClassName}>
      <span className="sr-only">
        <Translate>Template</Translate>
      </span>
      <TemplateLabel templateId={templateId} />
      <dl className={dlClassName}>
        <Title
          label="Title"
          title={title}
          iconId={iconId}
          translationContext={templateId}
          variant={layout}
        />
      </dl>
      {trailing}
    </MetadataCard>
  );
};

export { MetadataEntityHeader };
export type { MetadataEntityHeaderProps };
