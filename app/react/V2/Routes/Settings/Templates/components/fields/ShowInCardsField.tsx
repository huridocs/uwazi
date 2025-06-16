import React from 'react';
import { Controller } from 'react-hook-form';
import { Checkbox } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { Tooltip } from 'flowbite-react';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';

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
              // eslint-disable-next-line react/style-prop-object
              style="light"
              content={t(
                'System',
                'This property will appear in the library cards as part of the basic info.',
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
