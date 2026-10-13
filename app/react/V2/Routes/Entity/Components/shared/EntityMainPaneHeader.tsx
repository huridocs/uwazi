import React from 'react';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { EntityIcon } from '#V2/Components/CustomIcons/EntityIcon.js';
import { Entity } from '#V2/api/entities/types.js';
import { DocumentViewModeSelect } from '#V2/Routes/Entity/Components/document/index.js';
import { useEntityLanguage } from '../context/EntityLanguageContext.js';

type EntityMainPaneHeaderProps = {
  entity: Entity;
  showDocumentViewMode?: boolean;
};

const EntityMainPaneHeaderComponent = ({
  entity,
  showDocumentViewMode = false,
}: EntityMainPaneHeaderProps) => {
  const { mainDocument } = useEntityLanguage();
  const documentName = mainDocument?.originalname || mainDocument?.filename;

  return (
    <div className="flex shrink-0 items-center gap-2 min-h-11 pt-1 pb-2 px-3 border-b border-border">
      <div className="min-w-0 flex-1">
        <TemplateLabel templateId={entity.template} variant="tag" />
        <h1
          data-field-key="title"
          className="m-0 mt-1 flex min-w-0 items-start gap-1.5 text-sm font-semibold leading-snug text-ink"
          no-translate="true"
        >
          <EntityIcon data={entity.icon} className="mt-px shrink-0" />
          <span className="line-clamp-2 min-w-0 break-words" title={entity.title}>
            {entity.title}
          </span>
        </h1>
      </div>
      {showDocumentViewMode ? (
        <div className="flex min-w-0 max-w-[55%] shrink-0 items-center gap-2 self-center">
          {documentName ? (
            <span
              className="min-w-0 truncate text-xs text-ink-secondary"
              no-translate="true"
              title={documentName}
            >
              {documentName}
            </span>
          ) : null}
          <DocumentViewModeSelect />
        </div>
      ) : null}
    </div>
  );
};

const EntityMainPaneHeader = React.memo(EntityMainPaneHeaderComponent);

export { EntityMainPaneHeader };
