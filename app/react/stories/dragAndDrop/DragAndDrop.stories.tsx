/* eslint-disable react/no-multi-comp */
import React, { FC } from 'react';
import { DndProvider } from 'react-dnd';
import { Provider } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from 'app/V2/Components/UI';
import { Container, DragSource, IItemComponentProps } from 'app/V2/Components/Layouts/DradAndDrop';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { useDnDContext } from 'app/V2/CustomHooks/useDnDContext';

const sourceItems: IDraggable[] = [{ name: 'Item 4' }, { name: 'Item 5' }];
const CardWithRemove: FC<IItemComponentProps> = ({ item, context }) => (
  <div className="flex flex-row items-center justify-center w-full">
    <div>{item.name}</div>
    <Button
      type="button"
      color="error"
      size="small"
      className="p-1 ml-auto"
      onClick={() => {
        context.removeItem(item);
      }}
    >
      <TrashIcon className="w-4" />
    </Button>
  </div>
);

const DnDClient = ({ items, type, itemComponent }: any) => {
  const dndContext = useDnDContext(type, items, sourceItems);
  return (
    <div className="tw-content">
      <div className="gap-8 lg:grid lg:grid-cols-3 ">
        <div data-test-id="active-bin" className="col-span-2 ">
          <h1 className="mb-4 text-xl font-bold">Active Items</h1>
          <Container className="mb-4 text-sm" context={dndContext} itemComponent={itemComponent} />
        </div>
        <div className="flex items-center ">
          <div data-test-id="available-bin">
            <h2 className="mb-4 text-xl font-bold ">Available Items</h2>
            <DragSource className="mb-4 text-sm" context={dndContext} />
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof DnDClient> = {
  title: 'Components/DragAndDrop',
  component: DnDClient,
};

type Story = StoryObj<typeof DnDClient>;

const CardWithDnD: FC<IItemComponentProps> = ({ item, context }) => (
  <div className="flex flex-col w-full">
    <CardWithRemove item={item} context={context} />
    <Container
      context={context}
      itemComponent={CardWithRemove}
      name={`group_${item.name}`}
      parent={item}
    />
  </div>
);

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DndProvider backend={HTML5Backend}>
        <DnDClient items={args.items} type={args.type} itemComponent={args.itemComponent} />
      </DndProvider>
    </Provider>
  ),
};

const Basic = {
  ...Primary,
  args: {
    type: ItemTypes.BOX,
    items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
    iconHandle: true,
  },
};

const WithItemComponent = {
  ...Primary,
  args: {
    ...Basic.args,
    itemComponent: CardWithRemove,
  },
};

const Nested = {
  ...Primary,
  args: {
    ...Basic.args,
    iconHandle: false,
    items: [
      { name: 'Item 1', items: [{ name: 'Subitem 1' }] },
      { name: 'Item 2', items: [] },
      { name: 'Item 3', items: [] },
    ],
    itemComponent: CardWithDnD,
  },
};

export { Basic, WithItemComponent, Nested };

export default meta;
