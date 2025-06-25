import React from 'react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { Translate } from 'app/I18N';
import { DisplayPill } from './DisplayPills';

const TableTitle = ({
  items = [],
}: {
  items: { _id?: string; name: string; color?: string }[];
}) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <div className="bg-indigo-200 size-[28px] justify-center items-center rounded-full flex">
        <DocumentTextIcon className="w-5" />
      </div>
      <div>
        <Translate className="text-base font-semibold text-gray-900">Paragraphs</Translate>{' '}
        <Translate className="text-base italic text-gray-900">for</Translate>
      </div>
      {items.map(item => (
        <DisplayPill key={(item?._id || '') + (item?.name || '')} color={item?.color}>
          {item.name}
        </DisplayPill>
      ))}
    </div>
  </div>
);

export { TableTitle };
