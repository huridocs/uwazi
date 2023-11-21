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

type Story = StoryObj<typeof Table<SampleSchema>> & { args?: { showUpdates?: boolean } };

const StoryComponent = (props: TableProps<SampleSchema> & { showUpdates?: boolean }) => {
  const [tableRowsState, setTableRowsState] = useState<Row<SampleSchema>[]>();
  return (
    <>
      <div className="tw-content">
        <Table<SampleSchema>
          columns={props.columns}
          data={props.data}
          title={props.title}
          initialState={props.initialState}
          footer={props.footer}
          setSorting={props.setSorting}
          draggableRows={props.draggableRows === true}
          onChange={setTableRowsState}
        />
      </div>
      {props.showUpdates === true && (
        <>
          <span>Updated Items</span>
          <ul>
            {tableRowsState?.map((row, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <li key={`row_${index}`}>{row.getValue('title')}</li>
            ))}
          </ul>
        </>
      )}
    </>
  );
};
const Primary: Story = {
  render: args => <StoryComponent {...args} />,
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

const updatedData = [
  { title: 'Entity 2', created: 2, description: 'Short text' },
  {
    title: 'Entity 3',
    created: 3,
    description: 'Morbi congue et justo vitae congue. Vivamus porttitor et leo vitae efficitur',
  },
];

const CheckboxesTableComponent = (args: TableProps<SampleSchema>) => {
  const [selected1, setSelected1] = useState<Row<SampleSchema>[]>([]);
  const [selected2, setSelected2] = useState<Row<SampleSchema>[]>([]);
  const [table2Data, setTable2Data] = useState(args.data);

  return (
    <div className="tw-content">
      <Table<SampleSchema>
        columns={args.columns}
        data={args.data}
        title="Table A"
        enableSelection
        onSelection={setSelected1}
        draggableRows={args.draggableRows}
      />

      <p className="m-1">Selected items for Table A: {selected1.length}</p>
      <p className="m-1">
        Selections of Table A: {selected1.map(sel => `${sel.original.title}, `)}
      </p>

      <hr className="m-4" />

      <Table<SampleSchema>
        columns={args.columns}
        data={table2Data}
        title="Table B"
        enableSelection
        onSelection={setSelected2}
        draggableRows={args.draggableRows}
      />

      <p className="m-1">Selected items for Table B: {selected2.length}</p>
      <p className="m-1">
        Selections of Table B: {selected2.map(sel => `${sel.original.title}, `)}
      </p>

      <div className="flex gap-1">
        <button
          type="button"
          className="p-2 text-white border rounded bg-primary-600"
          onClick={() => setTable2Data(updatedData)}
        >
          Update table data
        </button>

        <button
          type="button"
          className="p-2 text-white border rounded bg-primary-600"
          onClick={() => setTable2Data(args.data)}
        >
          Reset table data
        </button>
      </div>
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
    footer: <span className="text-sm italic text-gray-500">* Table footer</span>,
    columns: [
      columnHelper.accessor('title', { header: 'Title', id: 'title' }),
      columnHelper.accessor('description', { header: 'Description' }),
      columnHelper.accessor('created', {
        header: 'Date added',
        cell: CustomCell,
        meta: { headerClassName: 'something' },
      }),
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
    setSorting: undefined,
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
      columnHelper.accessor('title', { id: 'title', header: 'Title' }),
      columnHelper.accessor('created', {
        id: 'created',
        header: 'Date added',
        meta: { headerClassName: 'w-1/3' },
      }),
      columnHelper.accessor('description', {
        id: 'description',
        header: 'Description',
        enableSorting: false,
        meta: { headerClassName: 'w-1/3 bg-error-100 text-blue-600' },
      }),
      columnHelper.display({
        id: 'action',
        header: 'Actions',
        cell: ActionsCell,
        meta: { headerClassName: 'text-center' },
      }),
    ],
  },
};

const WithCheckboxes = {
  ...Checkboxes,
  args: {
    ...Basic.args,
  },
};

const WithDnD: Story = {
  ...Primary,
  args: {
    ...Basic.args,
    draggableRows: true,
    initialState: { sorting: [{ id: 'description', desc: true }] },
    showUpdates: true,
  },
};
export { Basic, WithActions, WithCheckboxes, WithInitialState, WithDnD };

export default meta;
