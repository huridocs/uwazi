import React from 'react';
import { EntityOverlayPill } from '#V2/Components/Metadata/Components/EntityOverlayPill.js';
import { useEntityOverlayActions } from '#V2/Routes/Entity/Components/context/index.js';

type EntityTemplateLinkProps = {
  sharedId: string;
  templateId: string;
  label: string;
};

const EntityTemplateLinkComponent = ({ sharedId, templateId, label }: EntityTemplateLinkProps) => {
  const { openEntityOverlayTarget } = useEntityOverlayActions();
  return (
    <EntityOverlayPill
      sharedId={sharedId}
      templateId={templateId}
      label={label}
      onOpenEntity={openEntityOverlayTarget}
    />
  );
};

const EntityTemplateLink = React.memo(EntityTemplateLinkComponent);

export { EntityTemplateLink };
