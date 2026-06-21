import React from 'react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { ToggleButton, Tooltip } from '#V2/Components/UI/index.js';
import { ClientSettings } from '#app/apiResponseTypes.js';

interface CollectionOptionToggleProps {
  watch: UseFormWatch<ClientSettings>;
  setValue: UseFormSetValue<ClientSettings>;
  label: React.ReactElement;
  valueKey: keyof ClientSettings;
  tip: React.ReactNode;
}

const CollectionOptionToggle = ({
  watch,
  setValue,
  valueKey,
  label,
  tip,
}: CollectionOptionToggleProps) => {
  const checked = !!watch(valueKey);

  return (
    <div className="flex col-span-2 gap-4 items-center">
      <ToggleButton
        checked={checked}
        onToggle={() => setValue(valueKey, !checked, { shouldDirty: true })}
      />
      {label}
      <Tooltip content={tip} placement="right">
        <QuestionMarkCircleIcon className="h-5 w-5 text-ink-muted" />
      </Tooltip>
    </div>
  );
};

export { CollectionOptionToggle };
