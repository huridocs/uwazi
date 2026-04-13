import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

export const DefaultFilterField = ({ control }: { control: any }) => (
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
