import React, { useMemo } from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { Translate } from 'app/I18N';
import { FileType } from 'shared/types/fileType';
import { FileIcon } from 'V2/Components/UI/FileIcon';
import { formatBytes } from 'V2/shared/formatHelpers';
import { Entity } from 'app/V2/domain';

type FileListProps = {
  entity: Entity;
};

const FileList = ({ entity }: FileListProps) => {
  const thumbnailMap = useMemo(() => {
    const map = new Map<string, string>();
    if (!entity) return map;

    const allFiles = [...(entity.documents || []), ...(entity.attachments || [])];

    allFiles.forEach(file => {
      if (file.type === 'thumbnail' && file.filename) {
        const documentId = file.filename.replace(/\.jpg$/, '');
        map.set(documentId, `/files/thumbnails/${file.filename}`);
      }
    });

    return map;
  }, [entity]);

  const files = useMemo(() => {
    if (!entity) {
      return [];
    }
    const entityFiles: (FileType & { fileType: 'document' | 'attachment' })[] = [];
    if (entity.documents) {
      entity.documents.forEach(doc => {
        if ((doc.filename || doc.url) && doc.type !== 'thumbnail') {
          entityFiles.push({ ...doc, fileType: 'document' });
        }
      });
    }
    if (entity.attachments) {
      entity.attachments.forEach(att => {
        if ((att.filename || att.url) && att.type !== 'thumbnail') {
          entityFiles.push({ ...att, fileType: 'attachment' });
        }
      });
    }
    if (entity.metadata) {
      entity.metadata.forEach(meta => {
        if (meta.type === 'image' || meta.type === 'media') {
          entityFiles.push({ ...meta.values[0], fileType: 'attachment' });
        }
      });
    }
    return entityFiles;
  }, [entity]);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Translate>No files available</Translate>
      </div>
    );
  }

  const getFileTypeLabel = (file: FileType & { fileType: 'document' | 'attachment' }) => {
    if (file.url) {
      return 'Link';
    }
    if (file.mimetype) {
      const parts = file.mimetype.split('/');
      return parts[parts.length - 1].toUpperCase();
    }
    return file.fileType === 'document' ? 'Document' : 'Attachment';
  };

  const isDefaultFile = (file: FileType) => {
    return entity.mainDocument?._id && file._id === entity.mainDocument?._id;
  };

  const onFileSelect = (file: FileType) => {
    console.log('file', file);
  };
  return (
    <div className="flex flex-col h-full" role="region" aria-label="Files list">
      <div className="flex-1 overflow-y-auto p-4" role="list" aria-label="Available files">
        {/* all the listitem that fit in the row with a min width of 280px */}
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] xl:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] gap-4 w-full">
          {files.map((file, index) => {
            const fileUrl = file.url || (file.filename ? `/api/files/${file.filename}` : '');
            const downloadUrl = file.filename ? `${fileUrl}?download=true` : fileUrl;
            const fileSize = file.size ? formatBytes(file.size) : 'n/a';
            const isSelected = false; //selectedFile?._id === file._id;
            const isDefault = isDefaultFile(file);
            const fileName = file.originalname || file.url || 'Untitled';
            const fileTypeLabel = getFileTypeLabel(file);
            const ariaLabel = `${fileName}, ${fileTypeLabel}, ${fileSize}${isDefault ? ', default file' : ''}${isSelected ? ', selected' : ''}`;

            return (
              <div
                key={`${file._id || file.filename || index}`}
                role="listitem"
                aria-label={ariaLabel}
                className="border border-gray-100 rounded-lg"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onFileSelect(file)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onFileSelect(file);
                    }
                  }}
                  aria-label={`Select ${fileName}`}
                  className={`rounded-lg border flex flex-col gap-0 items-start justify-start cursor-pointer transition-colors 
                                        overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 
                                        focus-visible:ring-inset ${
                                          isSelected
                                            ? 'border-indigo-200 bg-indigo-50'
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                        }`}
                >
                  <div className="relative w-full h-48 overflow-hidden" aria-hidden="true">
                    <FileIcon
                      filename={file.filename || ''}
                      mimetype={file.mimetype || ''}
                      altText={fileName}
                      className="w-full h-full object-cover"
                      thumbnailUrl={file._id ? thumbnailMap.get(String(file._id)) : undefined}
                      isLink={!!file.url}
                    />
                    {isDefault && (
                      <div className="absolute left-4 top-4" aria-label="Default file">
                        <StarIconSolid className="w-6 h-6 text-yellow-500" aria-hidden="true" />
                      </div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-2 items-start justify-start w-full">
                    <div
                      className="text-gray-900 text-sm font-bold truncate w-full"
                      style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {fileName}
                    </div>
                    <div className="flex flex-row gap-1 items-end justify-end w-full">
                      <div className="flex flex-row gap-6 items-center justify-start flex-1">
                        <div className="flex flex-col gap-0 items-start">
                          <div className="text-gray-500 text-xs">
                            <Translate>Type</Translate>
                          </div>
                          <div className="text-gray-800 text-sm font-medium truncate max-w-[100px]">
                            {fileTypeLabel}
                          </div>
                        </div>
                        <div className="flex flex-col gap-0 items-start">
                          <div className="text-gray-500 text-xs">
                            <Translate>Size</Translate>
                          </div>
                          <div className="text-gray-800 text-sm font-medium">{fileSize}</div>
                        </div>
                      </div>
                      <a
                        href={downloadUrl}
                        download={!file.url}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => e.stopPropagation()}
                        aria-label={`Download ${fileName}`}
                        className="text-gray-700 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-inset rounded"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { FileList };
