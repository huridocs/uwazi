import React, { memo, useCallback, useState } from 'react';
import update from 'immutability-helper';
import type { FC } from 'react';
import { IDraggable, ItemTypes } from 'app/V2/shared/types';
import { DropZone } from './DropZone';
import { DraggableItem } from './DraggableItem';

interface ContainerProps {
  items: IDraggable[];
  type: ItemTypes;
  iconHandle?: boolean;
  removeCard?: Function;
}

const Container: FC<ContainerProps> = memo(
  ({ items, type, iconHandle = false }: ContainerProps) => {
    const [cards, setCards] = useState(items);

    const moveCard = useCallback((dragIndex: number, hoverIndex: number) => {
      setCards((prevCards: IDraggable[]) =>
        update(prevCards, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, prevCards[dragIndex] as IDraggable],
          ],
        })
      );
    }, []);

    const addCard = useCallback((newItem: any) => {
      setCards((prevCards: IDraggable[]) => update(prevCards, { $push: [newItem] }));
    }, []);
    return (
      <div>
        <div style={{ overflow: 'hidden', clear: 'both' }}>
          <ul>
            {cards.map((item: IDraggable, index: number) => (
              <DraggableItem
                name={item.name}
                key={item.name}
                iconHandle={iconHandle}
                type={type}
                index={index}
                sortLink={moveCard}
                addCard={addCard}
              />
            ))}
            <DropZone type={type} addCard={addCard} />
          </ul>
        </div>
      </div>
    );
  }
);

export { Container };
