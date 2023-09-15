/* eslint-disable react/no-multi-comp */
import React, { useEffect, useState } from 'react';
import { DndProvider, useDragDropManager } from 'react-dnd';
import { Provider } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { TrashIcon } from '@heroicons/react/20/solid';
import { Meta, StoryObj } from '@storybook/react';
import { Button } from 'app/V2/Components/UI';
import { Container } from 'app/V2/Components/Layouts/DradAndDrop';
import { DraggableItem } from 'app/V2/Components/Layouts/DradAndDrop/DraggableItem';
import { getRemovedItem, subject } from 'app/V2/Components/Layouts/DradAndDrop/Container';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';

const meta: Meta<typeof Container> = {
  title: 'Components/DragAndDrop',
  component: Container,
};

type Story = StoryObj<typeof Container>;

const DragSource = () => {
  const [availableItems, setAvailableItems] = useState([{ name: 'Item 4' }, { name: 'Item 5' }]);
  const dragDropManager = useDragDropManager();
  const handleMonitorChange = () => {
    const dropResult = dragDropManager.getMonitor().getDropResult();
    const item = dragDropManager.getMonitor().getItem();

    if (dropResult !== null && dropResult.onDrop && item !== null) {
      setAvailableItems(availableItems.filter((i: any) => i.name !== item.name));
    }
  };
  useEffect(() => {
    const listener = getRemovedItem().subscribe((removedItem: any) => {
      setAvailableItems(availableItems.concat(removedItem));
    });

    return () => listener.unsubscribe();
  }, [availableItems]);

  dragDropManager.getMonitor().subscribeToStateChange(handleMonitorChange);
  return (
    <div>
      <ul>
        {availableItems.map((item: any) => (
          <li key={item.name}>
            <DraggableItem item={item} type={ItemTypes.BOX} index={0}>
              {item.name}
            </DraggableItem>
          </li>
        ))}
      </ul>
    </div>
  );
};

const CardWithRemove = (item: IDraggable) => (
  <div>
    {item.name}{' '}
    <Button
      type="button"
      styling="light"
      color="error"
      onClick={() => {
        subject.next(item);
      }}
    >
      <TrashIcon className="w-4 text-white" />
    </Button>
  </div>
);

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DndProvider backend={HTML5Backend}>
        <div className="tw-content">
          <Container type={args.type} items={args.items} itemComponent={args.itemComponent} />
          <DragSource />
        </div>
      </DndProvider>
    </Provider>
  ),
};

const Basic = {
  ...Primary,
  args: {
    type: ItemTypes.BOX,
    items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
  },
};

const WithItemComponent = {
  ...Primary,
  args: {
    type: ItemTypes.BOX,
    items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
    itemComponent: CardWithRemove,
  },
};

export { Basic, WithItemComponent };

export default meta;
