/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { UseFormRegister } from 'react-hook-form';
import { EnableButtonCheckbox } from '#V2/Components/Forms/index.js';
import { Tooltip } from '#V2/Components/UI/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';

interface CollectionOptionToggleProps {
  register: UseFormRegister<ClientSettings>;
  label: React.ReactElement;
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
    {label}
    <Tooltip content={tip} placement="right">
      <QuestionMarkCircleIcon className="h-5 w-5 text-ink-muted" />
    </Tooltip>
  </div>
);

export { CollectionOptionToggle };
