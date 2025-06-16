import React from 'react';
import { Controller } from 'react-hook-form';
import { Checkbox } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

export const FilterField = ({ control }: { control: any }) => (
  <Controller
    name="filter"
    control={control}
    render={({ field }) => (
      <Checkbox
        name="filter"
        checked={field.value}
        onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
        label={
          <span className="flex items-center gap-1">
            <Translate>Use as filter</Translate>{' '}
            <Tooltip
              // eslint-disable-next-line react/style-prop-object
              style="light"
              content={t(
                'System',
                'This property will be used for filtering the library results. When properties match in equal name and field type with other entity types, they will be combined for filtering.',
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
