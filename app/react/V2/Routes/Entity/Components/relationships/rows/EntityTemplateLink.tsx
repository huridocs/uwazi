import React from 'react';
import { EntityOverlayPill } from '#V2/Components/Metadata/Components/EntityOverlayPill.js';
import { useEntityOverlay } from '#V2/Routes/Entity/Components/context/index.js';

type EntityTemplateLinkProps = {
  sharedId: string;
  templateId: string;
  label: string;
};

const EntityTemplateLink = ({ sharedId, templateId, label }: EntityTemplateLinkProps) => {
  const { openEntityOverlayTarget } = useEntityOverlay();
  return (
    <EntityOverlayPill
      sharedId={sharedId}
      templateId={templateId}
      label={label}
      onOpenEntity={openEntityOverlayTarget}
    />
  );
};

export { EntityTemplateLink };
