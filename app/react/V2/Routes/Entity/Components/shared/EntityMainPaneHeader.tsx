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
  <div className="flex h-10 flex-wrap items-center gap-2 px-0">
    <TemplateLabel templateId={entity.template} />
    <div className="m-0 min-w-0 flex flex-1 flex-wrap items-center gap-2">
      <span className="flex min-w-0 flex-1 flex-row flex-wrap items-start gap-2">
        <span
          className="min-w-0 flex-1 truncate text-xs font-semibold text-ink"
          no-translate="true"
        >
          {entity.title}
        </span>
      </span>
    </div>
    {showDocumentViewMode ? (
      <div className="ml-auto shrink-0">
        <DocumentViewModeSelect />
      </div>
    ) : null}
  </div>
);

export { EntityMainPaneHeader };
