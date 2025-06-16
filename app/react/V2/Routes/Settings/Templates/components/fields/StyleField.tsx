import React from 'react';
import { Controller } from 'react-hook-form';
import { RadioSelect } from 'V2/Components/Forms';
import { t, Translate } from 'app/I18N';
import { QuestionMarkCircleIcon } from '@heroicons/react/20/solid';
import { Tooltip } from 'flowbite-react';

export const StyleField = ({ control }: { control: any }) => (
  <Controller
    name="style"
    control={control}
    render={({ field }) => (
      <RadioSelect
        legend={<Translate>Style</Translate>}
        name="style"
        options={[
          {
            value: 'fill',
            defaultChecked: field.value === 'fill',
            label: (
              <span className="flex items-center gap-1" key="fill">
                <Translate>Fill</Translate>{' '}
                <Tooltip
                  // eslint-disable-next-line react/style-prop-object
                  style="light"
                  content={t(
                    'System',
                    'Will attempt to fill the container, using its entire width. In cards, cropping is likely to occur.',
                    null,
                    false
                  )}
                  placement="right"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                </Tooltip>
              </span>
            ),
          },
          {
            value: 'fit',
            defaultChecked: field.value === 'fit',
            label: (
              <span className="flex items-center gap-1" key="fit">
                <Translate>Fit</Translate>{' '}
                <Tooltip
                  // eslint-disable-next-line react/style-prop-object
                  style="light"
                  content={t(
                    'System',
                    'Will show the entire media inside the container.',
                    null,
                    false
                  )}
                  placement="right"
                >
                  <QuestionMarkCircleIcon className="w-5 h-5 text-gray-500" />
                </Tooltip>
              </span>
            ),
          },
        ]}
        onChange={field.onChange}
        orientation="horizontal"
      />
    )}
  />
);
