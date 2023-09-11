import React, { useState } from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider, useDragDropManager } from 'react-dnd';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { Container } from 'app/V2/Components/Layouts/DradAndDrop';
import { DraggableItem } from 'app/V2/Components/Layouts/DradAndDrop/DraggableItem';
import { ItemTypes } from 'app/V2/shared/types';

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

    if (dropResult !== null && dropResult.addCard && item !== null) {
      // console.log('getSourceId', dragDropManager.getMonitor().getSourceId());
      // console.log('getTargetIds', dragDropManager.getMonitor().getTargetIds());

      setAvailableItems(availableItems.filter((i: any) => i.name !== item.name));
    }
  };

  dragDropManager.getMonitor().subscribeToStateChange(handleMonitorChange);
  return (
    <div>
      <ul>
        {availableItems.map((item: any) => (
          <li key={item.name}>
            <DraggableItem
              name={item.name}
              type={ItemTypes.BOX}
              index={0}
              sortLink={undefined}
              iconHandle={false}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DndProvider backend={HTML5Backend}>
        <div className="tw-content">
          <Container type={args.type} items={args.items} removeCard={undefined} />
          <DragSource />
        </div>
      </DndProvider>
    </Provider>
  ),
};

const Target = {
  ...Primary,
  args: {
    type: ItemTypes.BOX,
    items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
  },
};

export { Target };

export default meta;
