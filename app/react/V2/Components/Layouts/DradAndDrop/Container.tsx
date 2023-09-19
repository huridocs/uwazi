import type { FC } from 'react';
import React, { memo, useCallback, useEffect, useState } from 'react';
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
  name: string;
  onChange?: Function;
  className?: string;
}

const removeSubject$ = new Subject();
const addSubject$ = new Subject();
const removeItem$ = () => removeSubject$.asObservable();
const addItem$ = () => addSubject$.asObservable();

const Container: FC<ContainerProps> = memo(
  ({
    name = 'container',
    items,
    type,
    iconHandle = false,
    itemComponent,
    onChange = () => {},
    className,
  }: ContainerProps) => {
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
      if (newItem.container !== name && (!newItem.target || newItem.target === name)) {
        if (newItem.container !== undefined) {
          removeSubject$.next({ ...newItem, moved: true });
        }
        setActiveItems((prevActiveItems: IDraggable[]) =>
          update(prevActiveItems, { $push: [{ ...newItem, container: name }] })
        );
      }
    }, []);

    useEffect(() => {
      onChange(activeItems);
    }, [activeItems, onChange]);

    useEffect(() => {
      const addSuscription = addItem$().subscribe(newItem => {
        onDropHandler(newItem as IDraggable);
      });
      const removeSuscription = removeItem$().subscribe(currentItem => {
        const removedItem = currentItem as IDraggable;
        if (removedItem.container === name || removedItem.container === undefined) {
          setActiveItems((prevActiveItems: IDraggable[]) =>
            update(prevActiveItems, {
              $apply: (values: IDraggable[]) =>
                values.filter(
                  (item: IDraggable) => item !== undefined && item.name !== removedItem.name
                ),
            })
          );
        }
      });

      return () => {
        addSuscription.unsubscribe();
        removeSuscription.unsubscribe();
      };
    });
    return (
      <div className="tw-content ">
        <div className={`${className}`} style={{ overflow: 'hidden', clear: 'both' }}>
          <ul>
            {activeItems
              .filter(item => item)
              .map(item => ({ ...item, container: name }))
              .map((item: IDraggable, index: number) => (
                <DraggableItem
                  item={item}
                  key={item.name}
                  iconHandle={iconHandle}
                  type={type}
                  index={index}
                  sortLink={moveItem}
                  className="flex flex-row gap-3 align-middle "
                >
                  <>
                    {itemComponent && itemComponent(item)}
                    {!itemComponent && item.name}
                  </>
                </DraggableItem>
              ))}
            <DropZone type={type} onDrop={onDropHandler} name={name} />
          </ul>
        </div>
      </div>
    );
  }
);

Container.defaultProps = {
  iconHandle: false,
  itemComponent: undefined,
  onChange: () => {},
};

export { Container, removeSubject$, addSubject$, removeItem$, addItem$ };
