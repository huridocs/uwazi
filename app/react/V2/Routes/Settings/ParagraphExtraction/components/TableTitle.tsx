import React from 'react';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { DisplayPill } from './DisplayPills';

const TableTitle = ({
  items = [],
  icon = 'user',
  Buttons,
}: {
  items: { _id?: string; name: string; color?: string }[];
  icon?: string;
  Buttons?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex items-center gap-2">
      <div className="bg-indigo-200 size-[28px] justify-center items-center rounded-full flex">
        <Icon className="size-[20px]" icon={icon} />
      </div>
      <div>
        <Translate className="text-base font-semibold text-gray-900">Paragraphs</Translate>{' '}
        <Translate className="italic text-base text-gray-900">for</Translate>
      </div>
      {items.map(item => (
        <DisplayPill key={(item?._id || '') + (item?.name || '')} color={item?.color}>
          {item.name}
        </DisplayPill>
      ))}
    </div>
    <div>{Buttons}</div>
  </div>
);

export { TableTitle };
