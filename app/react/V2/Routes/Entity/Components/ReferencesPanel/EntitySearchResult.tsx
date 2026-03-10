import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Entity } from 'V2/domain';
import { Card } from 'V2/Components/UI';
import { TemplateLabel } from 'V2/Components/Metadata/TemplateLabel';
import { FileType } from 'shared/types/fileType';
import { LanguageUtils } from 'shared/language';

type EntitySearchResultProps = {
  entity: Entity;
  onClick: () => void;
  isSelected?: boolean;
  mode?: 'entity' | 'text';
  selectedFile?: FileType;
  onFileSelect?: (file: FileType) => void;
};

export const EntitySearchResult = ({
  entity,
  onClick,
  isSelected = false,
  mode = 'entity',
  selectedFile,
  onFileSelect,
}: EntitySearchResultProps) => {
  const templateName = entity.template?.name || '';
  const templateColor = entity.template?.color || '#A4CAFE';
  const templateLabel = entity.template?.label || templateName;
  const templateId = entity.template?._id;

  // Format date - try to get creationDate or editDate
  const dateProperty = entity.creationDate || entity.editDate;
  const dateValue = dateProperty?.values?.[0]?.value;
  let formattedDate = '';
  if (dateValue) {
    try {
      const timestamp = typeof dateValue === 'number' ? dateValue : dateValue;
      formattedDate = new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      // Invalid date, leave empty
    }
  }

  const showFiles = mode === 'text' && isSelected;

  // Get PDF files from the entity
  const allFiles = [
    ...(entity.mainDocument || []),
    ...(entity.documents || []),
    ...(entity.attachments || []),
  ];
  const pdfFiles = showFiles ? allFiles.filter(f => f.mimetype === 'application/pdf') : [];

  const handleFileSelect = (file: FileType) => {
    if (onFileSelect) {
      onFileSelect(file);
    }
  };

  return (
    <>
      <div
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        }}
        className="cursor-pointer"
      >
        <Card
          className={`transition-colors ${isSelected ? 'bg-primary-50 border-2 border-primary-500' : 'hover:bg-gray-50'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm text-gray-900 line-clamp-2">{entity.title || '-'}</h3>
              {formattedDate && <p className="text-xs text-gray-600 mt-1">{formattedDate}</p>}
            </div>
            {templateLabel && (
              <TemplateLabel label={templateLabel} templateId={templateId} color={templateColor} />
            )}
          </div>
        </Card>
      </div>
      {showFiles && pdfFiles.length > 0 && (
        <div className="ml-4 flex flex-col gap-2 border-l-2 border-gray-200 pl-4">
          {pdfFiles.map((file, index) => {
            const fileId = String(file._id) || file.filename || `file-${index}`;
            const isFileSelected = selectedFile && String(selectedFile._id) === String(file._id);
            return (
              <div
                key={fileId}
                onClick={() => handleFileSelect(file)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleFileSelect(file);
                  }
                }}
                className={`p-2 bg-gray-50 rounded-md border-2 cursor-pointer transition-colors ${
                  isFileSelected
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-700">
                      {file.originalname || file.filename}
                    </span>
                    {file.totalPages && (
                      <span className="text-xs text-gray-500">
                        ({file.totalPages} {file.totalPages === 1 ? 'page' : 'pages'})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {file.language &&
                      file.language !== 'other' &&
                      (() => {
                        const languageCode =
                          LanguageUtils.fromISO639_3(file.language, false)?.ISO639_1 ||
                          file.language;
                        return (
                          <span className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-medium">
                            {languageCode.toUpperCase()}
                          </span>
                        );
                      })()}
                    <DocumentTextIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
