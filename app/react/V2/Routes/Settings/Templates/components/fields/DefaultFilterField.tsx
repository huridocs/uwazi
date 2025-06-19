import React, { useEffect } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { Checkbox } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

export const DefaultFilterField = ({ control }: { control: any }) => {
  const { setValue, watch } = useFormContext();
  const filter = watch('filter');

  useEffect(() => {
    if (!filter) {
      setValue('defaultfilter', false);
    }
  }, [filter, setValue]);

  return (
    <Controller
      name="defaultfilter"
      control={control}
      render={({ field }) => (
        <Checkbox
          name="defaultfilter"
          checked={field.value}
          onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
          label={
            <span className="flex items-center gap-1">
              <Translate>Default filter</Translate>{' '}
              <Tooltip
                // eslint-disable-next-line react/style-prop-object
                style="light"
                content={t(
                  'System',
                  'This property will be the default filter in the library for this template.',
                  null,
                  false
                )}
                placement="right"
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
