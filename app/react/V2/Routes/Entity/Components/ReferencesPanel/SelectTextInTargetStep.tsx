import React from 'react';
import { FileType } from 'shared/types/fileType';
import { PDF } from 'V2/Components/PDFViewer';
import { TemplateLabel } from 'app/V2/Components/Metadata/TemplateLabel';
import { Entity } from 'V2/domain';
import { TextSelection } from '@huridocs/react-text-selection-handler/dist/TextSelection';

type SelectTextInTargetStepProps = {
  selectedEntity: Entity | undefined;
  selectedFile: FileType | undefined;
  onTargetPdfSelect: (selection: TextSelection) => void;
  onTargetPdfDeselect: () => void;
};

const SelectTextInTargetStep = ({
  selectedEntity,
  selectedFile,
  onTargetPdfSelect,
  onTargetPdfDeselect,
}: SelectTextInTargetStepProps) => {
  if (!selectedFile?.filename) return null;
  return (
    <div className="flex flex-col flex-1 min-h-0 gap-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-md font-bold text-gray-900">{selectedEntity?.title}</h3>
        <h3 className="text-sm text-gray-500">{selectedFile.filename}</h3>
        <TemplateLabel
          label={selectedEntity?.template?.name || ''}
          templateId={selectedEntity?.template?._id}
          color={selectedEntity?.template?.color}
        />
      </div>
      <div className="flex-1 min-h-[200px] overflow-auto border border-gray-200 rounded-md">
        <PDF
          fileUrl={`/api/files/${selectedFile.filename}`}
          size={{ height: '100%', width: '100%', overflow: 'auto' }}
          onSelect={onTargetPdfSelect}
          onDeselect={onTargetPdfDeselect}
        />
      </div>
    </div>
  );
};

export { SelectTextInTargetStep };
