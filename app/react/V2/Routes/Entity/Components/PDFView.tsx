import React from 'react';
import { Translate } from 'app/I18N';
import { PDF } from 'V2/Components/PDFViewer';
import { Entity } from 'app/V2/domain';
import { TemplateLabel } from 'app/V2/Components/Metadata';
import { Truncate } from 'app/V2/Components/UI';

const PDFView = ({ entity }: { entity: Entity }) => {
  if (!entity?.mainDocument) {
    return <Translate>Loading</Translate>;
  }

  const { filename, originalname } = entity.mainDocument;

  return (
    <div className="flex flex-col h-full gap-2 min-h-0">
      <div className="w-full p-4 rounded bg-gray-50">
        <div className="flex flex-row justify-between align-middle gap-2">
          <TemplateLabel
            label={entity.template?.label || ''}
            templateId={entity.template?._id}
            color={entity.template?.color}
          />
          <span>pdf view selector</span>
        </div>
        <Truncate maxLength={80}>
          <h2 className="font-bold text-gray-900 mt-2 text-lg">{originalname}</h2>
        </Truncate>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <PDF fileUrl={`/api/files/${filename}`} size={{ height: '100%' }} />
      </div>
      <div>footer</div>
    </div>
  );
};

export { PDFView };
