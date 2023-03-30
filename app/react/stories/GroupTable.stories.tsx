import React from 'react';
import { ComponentStory, ComponentMeta } from '@storybook/react';
import { GroupTable } from 'app/V2/Components/UI/GroupTable';

const GroupTableStory = {
  title: 'Components/NestedTable',
  component: GroupTable,
};

const Template: ComponentStory<typeof GroupTable> = args => (
  <div className="tw-content">
    <GroupTable columns={args.columns} data={args.data} initialGroupBy={['key']} />
  </div>
);

const Nested = Template.bind({});

Nested.args = {
  data: [
    { key: 'Date', locale: 'es', language: 'Spanish', value: 'Fecha' },
    { key: 'Date', locale: 'en', language: 'English', value: 'Current Date' },
    { key: 'Signatories', locale: 'es', language: 'Spanish', value: 'Firmantes' },
    { key: 'Signatories', locale: 'en', language: 'English', value: 'Signatories' },
  ],
  columns: [
    {
      id: 'key',
      accessor: 'key',
      disableSortBy: true,
    },
    {
      Header: 'language',
      accessor: 'language',
      id: 'language',
      className: 'w-1/3',
      Aggregated: 'language',
      disableGroupBy: true,
    },
    {
      Header: 'locale',
      accessor: 'locale',
      id: 'locale',
      className: 'w-1/3',
      Aggregated: 'Locale',
      disableGroupBy: true,
    },
    {
      Header: 'Value',
      accessor: 'value',
      className: 'w-1/3',
      Aggregated: 'Value',
      disableGroupBy: true,
    },
  ],
};

export { Nested };

export default GroupTableStory as ComponentMeta<typeof GroupTable>;
