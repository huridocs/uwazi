import React from 'react';
import { Icon } from 'app/UI';
import { Translate } from 'app/I18N';
import { DisplayPills } from './DisplayPills';

const TableTitle = ({ items = [], icon = 'user' }: { items: string[]; icon?: string }) => (
  <div className="flex items-center gap-2">
    <div className="bg-indigo-200 size-[28px] justify-center items-center rounded-full flex">
      <Icon className="size-[20px]" icon={icon} />
    </div>
    <div>
      <Translate className="text-base font-semibold text-gray-900">Paragraphs</Translate>{' '}
      <Translate className="italic text-base text-gray-900">for</Translate>
    </div>
    <DisplayPills items={items} />
  </div>
);

export { TableTitle };
