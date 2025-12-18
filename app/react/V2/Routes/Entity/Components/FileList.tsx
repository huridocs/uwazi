import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from 'app/I18N';
import { Entity } from 'app/V2/domain';
import { getMimetypeFromUrl } from 'app/V2/shared/formatHelpers';
import { EntityFile, FileCard } from 'app/V2/Components/UI/Files/FileCard';
import { settingsAtom } from 'app/V2/atoms';
import { LanguageUtils } from 'shared/language';
import { FileType } from 'shared/types/fileType';

type FileListProps = {
  entity: Entity;
};

const FileList = ({ entity }: FileListProps) => {
  const { languages: languageList = [] } = useAtomValue(settingsAtom);
  const mainDocumentByLanguage: Record<string, FileType | undefined> = {};
  const files: EntityFile[] = useMemo(() => {
    if (!entity) return [];

    const otherDocuments: FileType[] = [];
    languageList.map(lang => {
      const [main, ...other] =
        entity.documents?.filter(
          d => d.language === LanguageUtils.fromISO639_1(lang.key).ISO639_3
        ) || [];
      mainDocumentByLanguage[lang.key] = main;
      otherDocuments.push(...other);
    });

    const fileNames = otherDocuments
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
      ...otherDocuments.map(f => ({
        ...f,
        fileType: 'document' as const,
        url: `/api/files/${f.filename}`,
      })),
      ...(entity.attachments?.map(f => ({
        ...f,
        fileType: 'attachment' as const,
        url: `/api/files/${f.filename}`,
      })) || []),
    ];
  }, [entity]);

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Translate>No files available</Translate>
      </div>
    );
  }

  const onFileSelect = (file: FileType) => {
    console.log('file', file);
  };
  return (
    <div className="flex flex-col h-full" role="region" aria-label="Files list">
      <div className="flex-1 overflow-y-auto p-4" role="list" aria-label="Available files">
        <div className="grid grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] sm:grid-cols-[repeat(auto-fill,_minmax(150px,_1fr))] lg:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] xl:grid-cols-[repeat(auto-fill,_minmax(280px,_1fr))] gap-4 w-full">
          {entity.mainDocument && (
            <FileCard
              key={`${entity.mainDocument._id || entity.mainDocument.filename || 0}`}
              translations={mainDocumentByLanguage}
              file={{ ...entity.mainDocument, fileType: 'mainDocument' as const }}
              index={0}
              onFileSelect={onFileSelect}
            />
          )}
          {files.map((file, index) => {
            return (
              <FileCard
                key={`${file._id || file.filename || index}`}
                file={file}
                index={index}
                onFileSelect={onFileSelect}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export { FileList };
