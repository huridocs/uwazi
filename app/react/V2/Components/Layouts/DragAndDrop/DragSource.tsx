import React from 'react';
import { withDnD } from 'app/componentWrappers';
import { IDraggable } from 'app/V2/shared/types';
import { DraggableItem } from './DraggableItem';
import type { IDnDContext } from './DnDDefinitions';

interface DragSourceComponentProps<T> {
  context: IDnDContext<T>;
  className?: string;
}
// eslint-disable-next-line react/function-component-definition
function DragSourceComponent<T>({ context, className = '' }: DragSourceComponentProps<T>) {
  return (
    <div className="tw-content">
      <ul className={className}>
        {context.availableItems.map((item: IDraggable<T>, index: number) => (
          <DraggableItem
            key={item.id}
            item={item}
            index={index}
            className="gap-5 p-3"
            context={context}
          >
            {context.getDisplayName(item)}
          </DraggableItem>
        ))}
      </ul>
    </div>
  );
}
function DragSource<T>(props: DragSourceComponentProps<T>) {
  return withDnD(DragSourceComponent<T>)(props);
}
export { DragSource };
