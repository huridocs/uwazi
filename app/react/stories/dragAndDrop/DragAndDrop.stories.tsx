import React from 'react';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DndProvider } from 'react-dnd';
import { Provider } from 'react-redux';
import { Meta, StoryObj } from '@storybook/react';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import { DropZone } from 'app/V2/Components/Layouts/DradAndDrop';
import { ItemTypes } from 'app/V2/shared/types';

const meta: Meta<typeof DropZone> = {
  title: 'Components/DragAndDrop',
  component: DropZone,
};

type Story = StoryObj<typeof DropZone>;

const Primary: Story = {
  render: args => (
    <Provider store={createStore()}>
      <DndProvider backend={HTML5Backend}>
        <div className="tw-content">
          <DropZone type={args.type} />
        </div>
      </DndProvider>
    </Provider>
  ),
};

const Target = { ...Primary, args: { type: ItemTypes.BOX } };

export { Target };

export default meta;
