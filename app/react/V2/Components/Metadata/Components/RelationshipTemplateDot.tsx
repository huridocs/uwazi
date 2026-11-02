import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { ColorDot } from '#V2/Components/UI/ColorDot.js';

type RelationshipTemplateDotProps = {
  templateId: string;
};

const RelationshipTemplateDot = ({ templateId }: RelationshipTemplateDotProps) => {
  const templates = useAtomValue(templatesAtom);
  const color = useMemo(
    () => templates.find(template => template._id === templateId)?.color,
    [templateId, templates]
  );
  if (!color) {
    return null;
  }
  return <ColorDot color={color} size="sm" ring />;
};

export { RelationshipTemplateDot };
