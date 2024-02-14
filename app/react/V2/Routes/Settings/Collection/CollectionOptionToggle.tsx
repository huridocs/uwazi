/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { EnableButtonCheckbox } from 'app/V2/Components/Forms';
import { ClientSettings } from 'app/apiResponseTypes';
import { UseFormRegister } from 'react-hook-form';

interface CollectionOptionToggleProps {
  register: UseFormRegister<ClientSettings>;
  label: string;
  valueKey: keyof ClientSettings;
  tip: React.ReactNode;
  defaultChecked?: boolean;
}

const CollectionOptionToggle = ({
  register,
  valueKey,
  label,
  tip,
  defaultChecked,
}: CollectionOptionToggleProps) => (
  <div className="flex col-span-2 gap-4 items-center">
    <EnableButtonCheckbox {...register(valueKey)} defaultChecked={defaultChecked} />
    <Translate className="text-sm font-medium text-gray-900">{label}</Translate>
    <Tooltip
      // eslint-disable-next-line react/style-prop-object
      style="light"
      content={tip}
      placement="right"
    >
      <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
    </Tooltip>
  </div>
);

export { CollectionOptionToggle };
