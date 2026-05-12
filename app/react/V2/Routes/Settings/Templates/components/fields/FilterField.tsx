import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

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
              content={t(
                'System',
                'This property will be used for filtering the library results. When properties match in equal name and field type with other entity types, they will be combined for filtering.',
                null,
                false
              )}
              placement="right"
              className="max-w-xs"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 text-ink-muted" />
            </Tooltip>
          </span>
        }
      />
    )}
  />
);
