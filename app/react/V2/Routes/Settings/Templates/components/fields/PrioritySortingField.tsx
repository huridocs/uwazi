import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

export const PrioritySortingField = ({ control }: { control: any }) => {
  const { setValue, watch } = useFormContext();
  const filter = watch('filter');

  useEffect(() => {
    setValue('prioritySorting', false);
  }, [filter, setValue]);

  return (
    <Controller
      name="prioritySorting"
      control={control}
      render={({ field }) => (
        <Checkbox
          name="prioritySorting"
          checked={field.value}
          onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
          label={
            <span className="flex items-center gap-1">
              <Translate>Priority sorting</Translate>{' '}
              <Tooltip
                // eslint-disable-next-line react/style-prop-object
                style="light"
                content={t(
                  'System',
                  'Properties marked as priority sorting will be used as default sorting criteria. If more than one property is marked as priority sorting the system will try to pick-up the best fit. When listing mixed template types, the system will pick-up the best combined priority sorting.',
                  null,
                  false
                )}
                placement="right"
                className="max-w-xs"
              >
                <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
              </Tooltip>
            </span>
          }
        />
      )}
    />
  );
};
