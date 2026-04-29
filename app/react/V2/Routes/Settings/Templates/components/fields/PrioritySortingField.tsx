import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

export const PrioritySortingField = ({ control }: { control: any }) => (
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
              content={t(
                'System',
                'Properties marked as priority sorting will be used as default sorting criteria. If more than one property is marked as priority sorting the system will try to pick-up the best fit. When listing mixed template types, the system will pick-up the best combined priority sorting.',
                null,
                false
              )}
              placement="right"
              className="max-w-xs"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 [color:var(--color-theme-text-muted)]" />
            </Tooltip>
          </span>
        }
      />
    )}
  />
);
