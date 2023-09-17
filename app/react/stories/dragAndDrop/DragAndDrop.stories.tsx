import React from 'react';
import { DndProvider } from 'react-dnd';
import { Provider } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from 'app/V2/Components/UI';
import { Container, DragSource } from 'app/V2/Components/Layouts/DradAndDrop';
import { subject } from 'app/V2/Components/Layouts/DradAndDrop/Container';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Container> = {
  title: 'Components/DragAndDrop',
  component: Container,
};

type Story = StoryObj<typeof Container>;

const availableItems: IDraggable[] = [{ name: 'Item 4' }, { name: 'Item 5' }];

const CardWithRemove = (item: IDraggable) => (
  <div className="flex flex-row w-full">
    <div>{item.name}</div>
    <Button
      type="button"
      color="error"
      size="small"
      className="p-1 ml-auto"
      onClick={() => {
        subject.next(item);
      }}
    >
      <TrashIcon className="w-4" />
    </Button>
  </div>
);

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DndProvider backend={HTML5Backend}>
        <Container
          type={args.type}
          items={args.items}
          itemComponent={args.itemComponent}
          iconHandle={args.iconHandle}
        />
        <DragSource items={availableItems} type={args.type} />
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

export { Basic, WithItemComponent };

export default meta;
