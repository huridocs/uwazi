import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { FileType } from '#shared/types/fileType.js';
import { LanguageUtils } from '#shared/language/index.js';
import { TemplateLabel } from '#V2/Components/Metadata/Components/index.js';
import { Card } from '#V2/Components/UI/Card.js';
import { Entity } from '#V2/api/entities/types.js';

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
  // Format date - try to get creationDate or editDate
  const dateProperty = entity.creationDate || entity.editDate;
  const dateValue = dateProperty;
  let formattedDate = '';
  if (dateValue) {
    try {
      formattedDate = new Date(dateValue).toLocaleDateString('en-US', {
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
  const allFiles = [...(entity.documents || []), ...(entity.attachments || [])];
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
          className={`transition-colors ${isSelected ? 'bg-parchment border-2 border-border' : 'hover:bg-warm'}`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-ink line-clamp-2">{entity.title || '-'}</h3>
              {formattedDate && <p className="text-xs text-ink-tertiary mt-1">{formattedDate}</p>}
            </div>
            <TemplateLabel templateId={entity.template} />
          </div>
        </Card>
      </div>
      {showFiles && pdfFiles.length > 0 && (
        <div className="ml-4 flex flex-col gap-2 border-l-2 border-border-soft pl-4">
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
                className={`rounded-md border-2 p-2 cursor-pointer transition-colors ${
                  isFileSelected
                    ? 'border-border bg-parchment'
                    : 'border-border-soft bg-warm hover:border-border'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {file.originalname || file.filename}
                    </span>
                    {file.totalPages && (
                      <span className="text-xs text-ink-tertiary">
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
                          <span className="rounded-md bg-warm px-2 py-0.5 text-micro font-medium text-ink-secondary">
                            {languageCode.toUpperCase()}
                          </span>
                        );
                      })()}
                    <DocumentTextIcon className="h-5 w-5 text-ink-muted" aria-hidden="true" />
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
