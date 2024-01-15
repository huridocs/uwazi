import React from 'react';
import { IDraggable } from 'app/V2/shared/types';
import { DraggableItem } from './DraggableItem';
import type { IDnDContext } from './DnDDefinitions';
import { withDnD } from '../../componentWrappers';

interface DragSourceComponentProps<T> {
  context: IDnDContext<T>;
  className?: string;
}
/* eslint-disable comma-spacing */
const DragSourceComponent = <T,>({ context, className = '' }: DragSourceComponentProps<T>) => (
  <div className="tw-content">
    <ul className={className}>
      {context.availableItems.map((item: IDraggable<T>, index: number) => (
        <DraggableItem
          key={item.dndId}
          item={item}
          index={index}
          className="flex gap-5 p-3 w-50"
          context={context}
        >
          {context.getDisplayName(item)}
        </DraggableItem>
      ))}
    </ul>
  </div>
);

/* eslint-disable comma-spacing */
const DragSource = <T,>(props: DragSourceComponentProps<T>) =>
  withDnD(DragSourceComponent<T>)(props);

export { DragSource };
