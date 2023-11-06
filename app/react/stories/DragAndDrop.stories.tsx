/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren } from 'react';
import { DndProvider } from 'react-dnd';
import { Provider } from 'react-redux';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Meta, StoryObj } from '@storybook/react';
import { ItemTypes } from 'app/V2/shared/types';
import { LEGACY_createStore as createStore } from 'V2/shared/testingHelpers';
import {
  CardWithDnD,
  CardWithRemove,
  DnDClient,
  DnDClientWithForm,
} from './dragAndDrop/DragAndDropComponents';

const meta: Meta<typeof DnDClient> = {
  title: 'Components/DragAndDrop',
  component: DnDClient,
};

type Story = StoryObj<typeof DnDClient>;

const RenderWithProvider = ({ children }: PropsWithChildren) => (
  <Provider store={createStore()}>
    <DndProvider backend={HTML5Backend}>{children}</DndProvider>
  </Provider>
);

const Primary: Story = {
  render: args => (
    <RenderWithProvider>
      <DnDClient items={args.items} type={args.type} itemComponent={args.itemComponent} />
    </RenderWithProvider>
  ),
};

const WithForm: Story = {
  render: args => (
    <RenderWithProvider>
      <DnDClientWithForm items={args.items} type={args.type} itemComponent={args.itemComponent} />
    </RenderWithProvider>
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

const Form = {
  ...WithForm,
  args: {
    type: ItemTypes.BOX,
    items: [{ name: 'Item 1' }, { name: 'Item 2' }, { name: 'Item 3' }],
    iconHandle: true,
  },
};

export { Basic, WithItemComponent, Nested, Form };
export default meta;
