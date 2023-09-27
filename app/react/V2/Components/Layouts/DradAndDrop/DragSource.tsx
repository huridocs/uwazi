import React from 'react';
import { withDnD } from 'app/componentWrappers';
import { IDnDContext } from 'app/V2/CustomHooks';
import { IDraggable } from 'app/V2/shared/types';
import { DraggableItem } from './DraggableItem';

const DragSourceComponent = ({
  context,
  className = '',
}: {
  context: IDnDContext;
  className?: string;
}) => (
  <div className="tw-content">
    <ul className={className}>
      {context.availableItems.map((item: IDraggable, index: number) => (
        <li key={item.name}>
          <DraggableItem item={item} index={index} className="gap-5" context={context}>
            {item.name}
          </DraggableItem>
        </li>
      ))}
    </ul>
  </div>
);
const DragSource = withDnD(DragSourceComponent);
export { DragSource };
