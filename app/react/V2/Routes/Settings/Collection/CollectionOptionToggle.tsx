/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { UseFormRegister } from 'react-hook-form';
import { Translate } from '#app/I18N/index.js';
import { EnableButtonCheckbox } from '#V2/Components/Forms/index.js';
import { Tooltip } from '#V2/Components/UI/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';

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
    <Translate className="text-sm font-medium [color:var(--color-theme-text-primary)]">
      {label}
    </Translate>
    <Tooltip content={tip} placement="right">
      <QuestionMarkCircleIcon className="h-5 w-5 [color:var(--color-theme-text-muted)]" />
    </Tooltip>
  </div>
);

export { CollectionOptionToggle };
