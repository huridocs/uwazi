import React from 'react';
import { Controller } from 'react-hook-form';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Checkbox } from '#V2/Components/Forms/index.js';
import { t, Translate } from '#app/I18N/index.js';
import { Tooltip } from '#V2/Components/UI/Tooltip.js';

export const GeneratedIdField = ({ control }: { control: any }) => (
  <Controller
    name="generatedId"
    control={control}
    render={({ field }) => (
      <Checkbox
        name="generatedId"
        checked={field.value}
        onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
        label={
          <span className="flex items-center gap-1">
            <Translate>Generated ID</Translate>{' '}
            <Tooltip
              content={t('System', 'A generated ID will be the default title.', null, false)}
              placement="right"
            >
              <QuestionMarkCircleIcon className="h-5 w-5 text-ink-muted" />
            </Tooltip>
          </span>
        }
      />
    )}
  />
);
