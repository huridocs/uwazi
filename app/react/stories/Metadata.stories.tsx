import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { Title, Date } from 'V2/Components/Metadata';

type StoryProps = {
  entity: any;
};

const MetadataDisplay = ({ entity }: StoryProps) => (
  <dt className="flex flex-col gap-4">
    <Title title={entity.title} label="placeholder" templateId="placeholder" />
    {entity.metadata.map(data => {
      if (
        data.type === 'date' ||
        data.type === 'daterange' ||
        data.type === 'multidate' ||
        data.type === 'multidaterange'
      ) {
        return (
          <Date timestamps={data.values} label={data.label} locale="en" templateId="placeholder" />
        );
      }
    })}
  </dt>
);

const meta: Meta<StoryProps> = {
  title: 'Metadata',
  component: MetadataDisplay,
};

type Story = StoryObj<StoryProps>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <MetadataDisplay entity={args.entity} />
    </div>
  ),
};

const Basic = {
  ...Primary,
  args: {
    entity: {
      title: 'Simple title',
      metadata: [
        {
          name: 'single_date',
          label: 'Single date',
          type: 'date',
          values: [1662380774900],
        },
        {
          name: 'multiple_date',
          label: 'Multiple dates',
          type: 'multidate',
          values: [1662380774900, 1664982774900, 1667588374900],
        },
        {
          name: 'date_range',
          label: 'Single date range',
          type: 'daterange',
          values: [{ from: 1662380774900, to: 1662985574900 }],
        },
        {
          name: 'multi_range',
          label: 'Multiple date ranges',
          type: 'multidaterange',
          values: [
            { from: 1662380774900, to: 1662985574900 },
            { from: 1664982774900, to: 1665673974900 },
            { from: 1667588374900, to: 1668193174900 },
          ],
        },
      ],
    },
  },
};

export { Basic };

export default meta;
