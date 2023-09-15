import type { FC } from 'react';
import React, { memo, useCallback, useState } from 'react';
import { Subject } from 'rxjs';
import update from 'immutability-helper';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { DraggableItem } from './DraggableItem';
import { DropZone } from './DropZone';

interface ContainerProps {
  items: IDraggable[];
  type: ItemTypes;
  itemComponent?: FC<IDraggable>;
  iconHandle?: boolean;
}

const subject = new Subject();
const getRemovedItem = () => subject.asObservable();

const Container: FC<ContainerProps> = memo(
  ({ items, type, iconHandle = false, itemComponent }: ContainerProps) => {
    const [activeItems, setActiveItems] = useState(items);

    const moveItem = useCallback((dragIndex: number, hoverIndex: number) => {
      setActiveItems((prevActiveItems: IDraggable[]) =>
        update(prevActiveItems, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevActiveItems[dragIndex] as IDraggable],
          ],
        })
      );
    }, []);

    const onDropHandler = useCallback((newItem: IDraggable) => {
      setActiveItems((prevActiveItems: IDraggable[]) =>
        update(prevActiveItems, { $push: [newItem] })
      );
    }, []);

    getRemovedItem().subscribe(removedItem => {
      setActiveItems((prevActiveItems: IDraggable[]) =>
        update(prevActiveItems, {
          $apply: (values: IDraggable[]) =>
            values.filter((item: IDraggable) => item.name !== (removedItem as IDraggable).name),
        })
      );
    });

    return (
      <div>
        <div style={{ overflow: 'hidden', clear: 'both' }}>
          <ul>
            {activeItems.map((item: IDraggable, index: number) => (
              <DraggableItem
                item={item}
                key={item.name}
                iconHandle={iconHandle}
                type={type}
                index={index}
                sortLink={moveItem}
              >
                <>
                  {itemComponent && itemComponent(item)}
                  {!itemComponent && item.name}
                </>
              </DraggableItem>
            ))}
            <DropZone type={type} onDrop={onDropHandler} />
          </ul>
        </div>
      </div>
    );
  }
);

Container.defaultProps = {
  iconHandle: false,
  itemComponent: undefined,
};

export { Container, getRemovedItem, subject };
