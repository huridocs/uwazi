import React, { useMemo } from 'react';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { EntityFile, FileCard } from '#V2/Components/UI/Files/FileCard.js';
import { Entity } from '#V2/api/entities/types.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';
import { templatesAtom } from '#V2/atoms/templatesAtom.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import { formatEntityFiles } from '#V2/formatters/index.js';

type FileListProps = {
  entity: Entity;
};

const FileList = ({ entity }: FileListProps) => {
  const templates = useAtomValue(templatesAtom);
  const locale = useAtomValue(localeAtom);
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(l => l.default)?.key;

  const files: EntityFile[] = useMemo(
    () =>
      formatEntityFiles(entity, templates, locale, defaultLanguage).map(({ file, fileType }) => ({
        ...file,
        fileType,
      })),
    [defaultLanguage, entity, locale, templates]
  );

  if (files.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <Translate>No files available</Translate>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" role="region" aria-label="Files list">
      <div className="flex-1 overflow-y-auto p-4" role="list" aria-label="Available files">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] xl:grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 w-full">
          {files.map((file, index) => (
            <FileCard key={`${file._id || file.filename || index}`} file={file} index={index} />
          ))}
        </div>
      </div>
    </div>
  );
};

export { FileList };
