import React from 'react';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { DocumentViewModeSelect } from '#V2/Routes/Entity/Components/document/index.js';

type EntityMainPaneHeaderProps = {
  entity: Entity;
  showDocumentViewMode?: boolean;
};

const EntityMainPaneHeader = ({
  entity,
  showDocumentViewMode = false,
}: EntityMainPaneHeaderProps) => (
  <div className="flex shrink-0 items-center gap-2 min-h-11 pt-1 pb-2 px-3 border-b border-border">
    <div className="min-w-0 flex-1">
      <TemplateLabel templateId={entity.template} variant="tag" />
      <h2
        className="m-0 mt-1 line-clamp-2 text-sm font-semibold leading-snug text-ink"
        no-translate="true"
        title={entity.title}
      >
        {entity.title}
      </h2>
    </div>
    {showDocumentViewMode ? (
      <div className="shrink-0 self-center">
        <DocumentViewModeSelect />
      </div>
    ) : null}
  </div>
);

export { EntityMainPaneHeader };
