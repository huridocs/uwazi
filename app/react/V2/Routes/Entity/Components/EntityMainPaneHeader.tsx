import React from 'react';
import { TemplateLabel, Title } from '#V2/Components/Metadata/Components/index.js';
import { Entity } from '#V2/api/entities/types.js';
import { DocumentViewModeSelect } from './DocumentViewModeSelect.js';
import { CountryFlag } from '#app/V2/Components/CustomIcons/index.js';

type EntityMainPaneHeaderProps = {
  entity: Entity;
  showDocumentViewMode?: boolean;
};

const EntityMainPaneHeader = ({
  entity,
  showDocumentViewMode = false,
}: EntityMainPaneHeaderProps) => (
  <div className="flex flex-wrap items-center gap-2">
    <TemplateLabel templateId={entity.template} />
    <dl className="m-0 min-w-0 flex flex-1 flex-wrap items-center gap-2">
      <span className="flex min-w-0 flex-row flex-wrap items-start gap-2">
        <span className="min-w-0 flex-1 whitespace-normal wrap-break-word" no-translate="true">
          {entity.title}
        </span>
      </span>
    </dl>
    {showDocumentViewMode ? (
      <div className="ml-auto shrink-0">
        <DocumentViewModeSelect />
      </div>
    ) : null}
  </div>
);

export { EntityMainPaneHeader };
