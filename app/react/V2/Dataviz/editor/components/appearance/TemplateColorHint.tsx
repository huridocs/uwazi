import React from 'react';
import { useAtomValue } from 'jotai';
import { templatesAtom } from '#V2/atoms/index.js';
import type { DatavizSource } from '#V2/Dataviz/types/definition.js';

type TemplateColorHintProps = {
  sources: DatavizSource[];
};

const TemplateColorHint = ({ sources }: TemplateColorHintProps) => {
  const templates = useAtomValue(templatesAtom);

  return (
    <div className="rounded-lg bg-vellum p-3">
      <p className="text-xs text-ink-secondary mb-2">
        Each series uses the template brand color when comparing data sources.
      </p>
      <div className="flex flex-wrap gap-3">
        {sources.map(source => {
          const template = templates.find(t => t._id === source.templateId);
          if (!template) return null;
          return (
            <span key={source.templateId} className="flex items-center gap-2 text-sm">
              <span
                className="h-4 w-4 rounded-full border border-border"
                style={{ backgroundColor: template.color || '#888' }}
              />
              {source.alias || template.name}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export { TemplateColorHint };
