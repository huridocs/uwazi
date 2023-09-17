import React, { useEffect, useState } from 'react';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { withDnD } from 'app/componentWrappers';
import { DraggableItem } from './DraggableItem';
import { getRemovedItem } from './Container';

interface DragSourceProps {
  items: IDraggable[];
  type: ItemTypes;
  useDragDropManager?: Function;
}
const DragSourceComponent = ({ items, type, useDragDropManager = () => {} }: DragSourceProps) => {
  const [availableItems, setAvailableItems] = useState(items);
  const dragDropManager = useDragDropManager();
  const handleMonitorChange = () => {
    const dropResult = dragDropManager.getMonitor().getDropResult();
    const { item } = dragDropManager.getMonitor().getItem() || {};

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
    <div className="tw-content">
      <ul>
        {availableItems.map((item: any) => (
          <li key={item.name}>
            <DraggableItem item={item} type={type} index={0} className="gap-5">
              {item.name}
            </DraggableItem>
          </li>
        ))}
      </ul>
    </div>
  );
};
const DragSource = withDnD(DragSourceComponent);
export { DragSource };
