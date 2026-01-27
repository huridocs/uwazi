import React, { useMemo } from 'react';
import { Translate } from '#app/I18N/index.js';
import { Entity } from '#V2/domain/index.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { EntityFile, FileCard } from '#V2/Components/UI/Files/FileCard.js';

type FileListProps = {
  entity: Entity;
};

const FileList = ({ entity }: FileListProps) => {
  const files: EntityFile[] = useMemo(() => {
    if (!entity) return [];

    const fileNames = (entity.documents || [])
      .map(f => f.filename)
      .concat(entity.attachments?.map(f => f.filename) || []);

    const metadataFiles: EntityFile[] = entity.metadata
      .map(meta => {
        if (
          (meta.type !== 'image' && meta.type !== 'media') ||
          !meta.values ||
          meta.values.length === 0
        ) {
          return null;
        }
        const firstValue = meta.values[0] as { value: unknown; alt?: string };
        if (!firstValue || typeof firstValue.value !== 'string') return null;
        const value = firstValue.value;
        const fileName = value.split('/').pop() || '';
        if (fileNames.includes(fileName)) return null;
        return {
          url: value,
          fileType: meta.type as 'image' | 'media',
          mimetype: getMimetypeFromUrl(value),
          originalname: firstValue.alt || fileName || 'Untitled',
        } as EntityFile;
      })
      .filter((file): file is EntityFile => file !== null);
    return [
      ...metadataFiles,
      ...(entity.documents?.map(f => ({
        ...f,
        fileType: 'document' as const,
        url: `/api/files/${f.filename}`,
      })) || []),
      ...(entity.attachments?.map(f => ({
        ...f,
        fileType: 'attachment' as const,
        url: `/api/files/${f.filename}`,
      })) || []),
    ];
  }, [entity]);

  if ((entity.mainDocument?.length ?? 0) === 0 && files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Translate>No files available</Translate>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Files list">
      <div className="flex-1 overflow-y-auto p-4" role="list" aria-label="Available files">
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] xl:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] gap-4 w-full">
          {entity.mainDocument && entity.mainDocument.length > 0 && (
            <FileCard
              key={`${entity.mainDocument[0]._id || entity.mainDocument[0]?.filename || 0}`}
              translations={entity.mainDocument.slice(0, 1)}
              file={{ ...entity.mainDocument[0], fileType: 'mainDocument' as const }}
              index={0}
            />
          )}
          {files.map((file, index) => {
            return (
              <FileCard key={`${file._id || file.filename || index}`} file={file} index={index} />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { FileList };
