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
  <div className="flex h-10 shrink-0 items-center gap-2 border-b border-border px-3">
    <TemplateLabel templateId={entity.template} />
    <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink" no-translate="true">
      {entity.title}
    </span>
    {showDocumentViewMode ? (
      <div className="shrink-0">
        <DocumentViewModeSelect />
      </div>
    ) : null}
  </div>
);

export { EntityMainPaneHeader };
