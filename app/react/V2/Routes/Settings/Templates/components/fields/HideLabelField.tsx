import React from 'react';
import { Controller } from 'react-hook-form';
import { Checkbox } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

export const HideLabelField = ({ control }: { control: any }) => (
  <Controller
    name="noLabel"
    control={control}
    render={({ field }) => (
      <Checkbox
        name="noLabel"
        checked={field.value}
        onChange={e => field.onChange((e.target as HTMLInputElement).checked)}
        label={
          <span className="flex items-center gap-1">
            <Translate>Hide label</Translate>{' '}
            <Tooltip
              // eslint-disable-next-line react/style-prop-object
              style="light"
              content={t('System', 'This property will be shown without the label', null, false)}
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
