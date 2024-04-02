import React from 'react';
import { Row } from '@tanstack/react-table';
import { FileType } from 'shared/types/fileType';

const FileList = ({ items }: { items: Row<FileType>[] | FileType[] }) => (
  <ul className="flex flex-wrap gap-8 max-w-md list-disc list-inside">
    {items.map(item => {
      const file = 'original' in item ? item.original : item;
      return <li key={file._id as string}>{file.originalname}</li>;
    })}
  </ul>
);

export { FileList };
