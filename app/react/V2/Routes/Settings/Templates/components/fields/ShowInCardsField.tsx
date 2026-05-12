import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

export const ShowInCardsField = ({ control }: { control: any }) => (
  <Controller
    name="showInCard"
    control={control}
    render={({ field }) => (
      <Checkbox
        name="showInCard"
        checked={field.value}
        onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
        label={
          <span className="flex items-center gap-1">
            <Translate>Show in cards</Translate>{' '}
            <Tooltip
              content={t(
                'System',
                'This property will appear in the library cards as part of the basic info.',
                null,
                false
              )}
              placement="right"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 text-(--color-theme-text-muted)" />
            </Tooltip>
          </span>
        }
      />
    )}
  />
);
