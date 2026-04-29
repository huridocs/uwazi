import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

export const RequiredField = ({ control }: { control: any }) => (
  <Controller
    name="required"
    control={control}
    render={({ field }) => (
      <Checkbox
        name="required"
        checked={field.value}
        onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
        label={
          <span className="flex items-center gap-1">
            <Translate>Required property</Translate>{' '}
            <Tooltip
              content={t(
                'System',
                "You won't be able to save an entity if this property is empty.",
                null,
                false
              )}
              placement="right"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 [color:var(--color-theme-text-muted)]" />
            </Tooltip>
          </span>
        }
      />
    )}
  />
);
