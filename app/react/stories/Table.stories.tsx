import React, { useState } from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { CellContext, createColumnHelper, Row } from '@tanstack/react-table';
import { Table, TableProps } from 'V2/Components/UI';
import { Button } from 'V2/Components/UI/Button';

const meta: Meta<typeof Table> = {
  title: 'Components/Table',
  component: Table,
};

type SampleSchema = {
  title: string;
  description: string;
  created: number;
};

type Story = StoryObj<typeof Table<SampleSchema>>;

const Primary: Story = {
  render: args => (
    <div className="tw-content">
      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title={args.title}
        initialState={args.initialState}
      />
    </div>
  ),
};

const CustomCell = ({ cell }: CellContext<SampleSchema, any>) => (
  <div className="text-center text-white bg-gray-400 rounded">{cell.getValue()}</div>
);

const ActionsCell = () => (
  <div className="flex gap-1">
    <Button>Primary</Button>
    <Button styling="outline">Secondary</Button>
  </div>
);

const CheckboxesTableComponent = (args: TableProps<SampleSchema>) => {
  const [selected1, setSelected1] = useState<Row<SampleSchema>[]>([]);
  const [selected2, setSelected2] = useState<Row<SampleSchema>[]>([]);

  return (
    <div className="tw-content">
      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title="Table A"
        enableSelection
        onSelection={setSelected1}
      />

      <p className="m-1">Selected items for Table A: {selected1.length}</p>
      <p className="m-1">
        Selections of Table A: {selected1.map(sel => `${sel.original.title}, `)}
      </p>

      <hr className="m-4" />

      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title="Table B"
        enableSelection
        onSelection={setSelected2}
      />

      <p className="m-1">Selected items for Table B: {selected2.length}</p>
      <p className="m-1">
        Selections of Table B: {selected2.map(sel => `${sel.original.title}, `)}
      </p>
    </div>
  );
};

const Checkboxes: Story = {
  render: CheckboxesTableComponent,
};

const columnHelper = createColumnHelper<SampleSchema>();

const Basic: Story = {
  ...Primary,
  args: {
    title: 'Table name',
    columns: [
      columnHelper.accessor('title', { header: 'Title', id: 'title' }),
      columnHelper.accessor('description', { header: 'Description', enableSorting: false }),
      {
        ...columnHelper.accessor('created', {
          header: 'Date added',
          cell: CustomCell,
        }),
        className: 'something',
      },
    ],
    data: [
      { title: 'Entity 2', created: 2, description: 'Short text' },
      {
        title: 'Entity 1',
        created: 1,
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus vel efficitur quam. Donec feugiat at libero at rutrum.',
      },
      {
        title: 'Entity 3',
        created: 3,
        description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
      },
    ],
  },
};

const WithInitialState: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    initialState: { sorting: [{ id: 'description', desc: true }] },
  },
};

const WithActions: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    columns: [
      { ...columnHelper.accessor('title', { id: 'title', header: 'Title' }), className: 'w-1/3' },
      {
        ...columnHelper.accessor('created', {
          id: 'created',
          header: 'Date added',
          enableSorting: false,
        }),
        className: 'w-1/3',
      },
      {
        ...columnHelper.accessor('description', {
          id: 'description',
          header: 'Description',
          enableSorting: false,
        }),
        className: 'w-1/3 bg-red-500 text-white',
      },
      {
        ...columnHelper.display({ id: 'action', header: 'Actions', cell: ActionsCell }),
        className: 'text-center',
      },
    ],
  },
};

const WithCheckboxes = {
  ...Checkboxes,
  args: {
    ...Basic.args,
  },
};

export { Basic, WithActions, WithCheckboxes, WithInitialState };

export default meta;
